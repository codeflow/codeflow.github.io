#!/usr/bin/env node
/* PWA smoke test in headless Chrome (Chrome DevTools Protocol, no dependencies — Node >= 22).
   usage: node scripts/check_pwa.js [origin]      default: http://localhost:4000
   Checks: manifest reachable and valid, service worker registers and activates, the shell is precached,
   and a page never visited still renders (network-first with cache) while a cold URL falls back to /offline/. */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ORIGIN = process.argv[2] || 'http://localhost:4000';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333 + Math.floor(Math.random() * 500);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-pwa-'));

const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function targets() {
  for (let i = 0; i < 40; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/json`); return await r.json(); } catch (e) { await sleep(250); }
  }
  throw new Error('Chrome did not expose the DevTools endpoint');
}

class CDP {
  constructor(url) { this.ws = new WebSocket(url); this.id = 0; this.pending = new Map(); this.events = [];
    this.ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && this.pending.has(d.id)) { this.pending.get(d.id)(d); this.pending.delete(d.id); } else if (d.method) this.events.push(d); }; }
  open() { return new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; }); }
  send(method, params = {}) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((res, rej) => this.pending.set(id, (d) => d.error ? rej(new Error(method + ': ' + d.error.message)) : res(d.result))); }
  async eval(expr) { const r = await this.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + JSON.stringify(r.exceptionDetails.exception)); return r.result.value; }
  async goto(url, ms = 2500) { await this.send('Page.navigate', { url }); await sleep(ms); }
}

(async () => {
  const results = [];
  const ok = (name, cond, detail) => { results.push([cond ? 'PASS' : 'FAIL', name, detail]); };
  try {
    const page = (await targets()).find(t => t.type === 'page');
    const cdp = new CDP(page.webSocketDebuggerUrl); await cdp.open();
    await cdp.send('Page.enable'); await cdp.send('Network.enable');

    // 1. manifest
    const man = await fetch(`${ORIGIN}/manifest.webmanifest`);
    const manJson = man.ok ? await man.json() : null;
    ok('manifest', !!manJson && manJson.name && manJson.start_url && manJson.icons && manJson.icons.length >= 2,
      manJson ? `${man.headers.get('content-type')}; ${manJson.icons.length} icons; display=${manJson.display}` : `HTTP ${man.status}`);
    for (const ic of (manJson ? manJson.icons : [])) { const r = await fetch(ORIGIN + ic.src); ok('icon ' + ic.src, r.ok && (r.headers.get('content-type') || '').includes('png'), `HTTP ${r.status}`); }

    // 2. service worker registers, activates and precaches the shell
    await cdp.goto(`${ORIGIN}/`, 3500);
    const sw = await cdp.eval(`(async () => { for (let i = 0; i < 20; i++) { const r = await navigator.serviceWorker.getRegistration(); if (r && r.active) return { state: r.active.state, url: r.active.scriptURL, scope: r.scope }; await new Promise(x => setTimeout(x, 250)); } return null; })()`);
    ok('service worker active', !!sw, sw ? `${sw.url} scope=${sw.scope}` : 'no active registration');
    await sleep(1500);
    const cache = await cdp.eval(`(async () => { const keys = await caches.keys(); if (!keys.length) return { keys, n: 0, urls: [] }; const c = await caches.open(keys[0]); const reqs = await c.keys(); return { keys, n: reqs.length, urls: reqs.map(r => new URL(r.url).pathname) }; })()`);
    ok('precache', cache.n >= 8 && cache.urls.includes('/offline/') && cache.urls.some(u => u.endsWith('shell.js')), `${cache.keys.join(',')}: ${cache.n} entries`);

    // 3. offline: a visited page renders from cache, an unvisited one falls back to /offline/
    const post = await cdp.eval(`(() => { const a = document.querySelector('#postList a[href*="/articles/"]'); return a ? a.getAttribute('href') : null; })()`);
    await cdp.goto(ORIGIN + post, 2500);
    const titleOnline = await cdp.eval('document.title');
    // network emulation on the page does not reach fetches made by the worker: emulate offline in the worker target too
    const swTarget = (await targets()).find(t => t.type === 'service_worker' && t.url.includes('service-worker.js'));
    const swc = swTarget ? new CDP(swTarget.webSocketDebuggerUrl) : null;
    if (swc) { await swc.open(); await swc.send('Network.enable'); }
    const setOffline = async (offline) => {
      const cond = { offline, latency: 0, downloadThroughput: -1, uploadThroughput: -1 };
      await cdp.send('Network.emulateNetworkConditions', cond);
      if (swc) await swc.send('Network.emulateNetworkConditions', cond);
    };
    await setOffline(true);
    await cdp.goto(ORIGIN + post, 2500);
    const titleOffline = await cdp.eval('document.title');
    ok('offline: visited page served from cache', titleOffline === titleOnline && !/offline/i.test(titleOffline), `"${titleOffline}"`);
    await cdp.goto(`${ORIGIN}/never-visited-${Date.now()}/`, 2500);
    const fallback = await cdp.eval('document.title + " | " + (document.querySelector("h1") ? document.querySelector("h1").textContent : "")');
    ok('offline: unknown page falls back to /offline/', /offline/i.test(fallback), `"${fallback}"`);
    await setOffline(false);
  } catch (e) {
    results.push(['FAIL', 'harness', String(e.message || e)]);
  } finally {
    chrome.kill(); await sleep(800);
    for (let i = 0; i < 5; i++) { try { fs.rmSync(profile, { recursive: true, force: true }); break; } catch (e) { await sleep(500); } }
  }
  for (const [s, n, d] of results) console.log(`${s} ${n.padEnd(44)} ${d}`);
  const failed = results.filter(r => r[0] === 'FAIL').length;
  console.log(failed ? `${failed} check(s) failed` : 'ALL PWA CHECKS PASSED');
  process.exit(failed ? 1 : 0);
})();

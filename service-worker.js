---
layout: null
---
/* Codeflow service worker.
   - precaches the shell (homes, offline page, CSS, JS, icons) at install
   - pages: network first, cache fallback, then the offline page
   - same-origin assets: stale-while-revalidate
   - cross-origin requests (giscus, GitHub) are never intercepted
   The cache name carries the build time, so every deploy retires the previous cache. */
var V = '{{ site.time | date: "%Y%m%d%H%M%S" }}';
var CACHE = 'codeflow-' + V;
var OFFLINE = '/offline/';
var PRECACHE = [
  '/', {% for l in site.data.i18n %}{% if l[0] != site.lang %}'/{{ l[0] }}/', {% endif %}{% endfor %}OFFLINE,
  '/assets/css/adf-fusion.css?v=' + V,
  '/assets/css/adf-fusion.overrides.css?v=' + V,
  '/assets/js/shell.js?v=' + V,
  '/assets/js/post.js?v=' + V,
  '/assets/codeflow.png',
  '/assets/icons/icon-192.png',
  '/manifest.webmanifest'{% for l in site.data.i18n %}{% if l[0] != site.lang %}, '/{{ l[0] }}/manifest.webmanifest'{% endif %}{% endfor %}
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      // one failing URL must not block the install of the whole worker
      return Promise.all(PRECACHE.map(function (url) { return cache.add(url).catch(function () {}); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      // 'codeflow-v1' belonged to the previous site (a hash-routed SPA served cache-first): those clients are
      // still showing the old app, so they get one reload after this worker takes over. Normal deploys never reload.
      var legacy = keys.indexOf('codeflow-v1') >= 0;
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }))
        .then(function () { return self.clients.claim(); })
        .then(function () {
          if (!legacy) return;
          return self.clients.matchAll({ type: 'window' }).then(function (cs) { cs.forEach(function (c) { c.navigate(c.url); }); });
        });
    })
  );
});

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise(function (_, reject) { setTimeout(function () { reject(new Error('timeout')); }, ms); })]);
}

function isAsset(url) {
  return /\.(css|js|png|jpg|jpeg|gif|svg|ico|json|webmanifest|woff2?)$/.test(url.pathname);
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') >= 0) {
    // pages are keyed by path only: the Home applies ?type=&value= and ?q= on the client, the document is the same
    var key = url.origin + url.pathname;
    event.respondWith(
      caches.match(key).then(function (hit) {
        var net = fetch(req).then(function (res) {
          if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (cache) { cache.put(key, copy); }); }
          return res;                                   // error pages are returned but never cached
        });
        // with a cached copy at hand, do not wait more than 3 s for a slow network; the fresh copy still lands in the cache
        var first = hit ? withTimeout(net, 3000).catch(function () { return hit; }) : net;
        return first.catch(function () { return caches.match(OFFLINE); });
      })
    );
    return;
  }

  if (isAsset(url)) {
    event.respondWith(
      caches.match(req).then(function (hit) {
        var refresh = fetch(req).then(function (res) {
          if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (cache) { cache.put(req, copy); }); }
          return res;
        }).catch(function () { return hit; });
        return hit || refresh;
      })
    );
  }
});

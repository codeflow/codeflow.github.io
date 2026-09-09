/* Codeflow — shell.js: comportamento comum a todas as páginas (sidebar, filtros, menu móvel, splitter, gavetas). */
var CF = window.CODEFLOW || {};
var LANG = CF.lang || 'en';
var T = CF.i18n || {};
var ALL_POSTS = CF.posts || [];
var ARTICLES = ALL_POSTS.filter(function (p) { return p.lang === LANG; });   // só o idioma da página
var HOME_URL = CF.home || '/';

/* Display name of a category / topic / section in the page language (the key itself stays shared). */
var LABELS = CF.labels || {};
function label(name) { return (name && LABELS[name]) || name; }

/* i18n helper: t('showing', {first: 1, last: 6, total: 18}) */
function t(key, vars) {
  var s = (T && T[key] !== undefined) ? String(T[key]) : key;
  if (vars) Object.keys(vars).forEach(function (k) { s = s.split('{' + k + '}').join(vars[k]); });
  return s;
}
var PAGE_SIZE = 6;
var MONTHS = CF.months || ["January","February","March","April","May","June","July","August","September","October","November","December"];
var state = { page: 1, type: "", value: "" };   // type: '' | 'cat' | 'tag' | 'month' | 'text'

function esc(t) { return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function monthKey(a) { var p = a.date.split("/"); return p[2] + "-" + p[0]; }          // "2026-08"
function monthLabel(k) { var p = k.split("-"); return MONTHS[+p[1] - 1] + " " + p[0]; }

function filtered() {
  var ty = state.type, v = state.value;
  if (!ty || !v) return ARTICLES;
  return ARTICLES.filter(function (a) {
    if (ty === "cat")   return a.cat === v;
    if (ty === "topic") return a.topic === v;
    if (ty === "tag")   return a.tags.indexOf(v) >= 0;
    if (ty === "month") return monthKey(a) === v;
    if (ty === "text")  return textMatch(a, v);
    return true;
  });
}

/* Full-text search: uses the static index (search.json, with the stripped article text) once it is
   loaded; before that, falls back to title + excerpt + tags. Only html/js — no server needed. */
var SEARCH_INDEX = null;
function loadSearchIndex(cb) {
  if (SEARCH_INDEX || !CF.searchUrl) { if (cb) cb(); return; }
  fetch(CF.searchUrl).then(function (r) { return r.json(); }).then(function (rows) {
    SEARCH_INDEX = {};
    rows.forEach(function (r) { SEARCH_INDEX[r.lang + '|' + r.key] = (r.title + ' ' + r.excerpt + ' ' + r.tags.join(' ') + ' ' + r.content).toLowerCase(); });
    if (cb) cb();
  }).catch(function () { if (cb) cb(); });
}
function textMatch(a, q) {
  var words = q.toLowerCase().split(/\s+/).filter(Boolean);
  var hay = SEARCH_INDEX && SEARCH_INDEX[a.lang + '|' + a.key]
    ? SEARCH_INDEX[a.lang + '|' + a.key]
    : (a.title + ' ' + a.excerpt + ' ' + a.tags.join(' ')).toLowerCase();
  return words.every(function (w) { return hay.indexOf(w) >= 0; });
}
function filterLabel() {
  if (!state.type || !state.value) return "";
  var key = { cat: 'filter_in', topic: 'filter_topic', tag: 'filter_tag', month: 'filter_month', text: 'filter_text' }[state.type];
  var v = state.type === 'month' ? monthLabel(state.value) : (state.type === 'cat' || state.type === 'topic') ? label(state.value) : state.value;
  return key ? t(key, { v: v }) : "";
}
function render() {
  var list = filtered();
  var pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  if (state.page > pages) state.page = pages;
  var start = (state.page - 1) * PAGE_SIZE;
  var slice = list.slice(start, start + PAGE_SIZE);

  var html = slice.map(function (a) {
    return '<div class="cf-post">' +
      '<div class="postTitle"><a href="' + a.href + '">' + esc(a.title) + '</a></div>' +
      '<div class="cf-articleMeta">' +
        '<span class="item">' + t('published_on') + ' <b>' + a.date + '</b></span><span class="sep">·</span> ' +
        '<span class="item"><b>' + esc(label(a.cat)) + '</b></span><span class="sep">·</span> ' +
        '<span class="item">' + t('reading_time') + ' <b>' + a.min + ' ' + t('min') + '</b></span></div>' +
      '<p>' + esc(a.excerpt) + '</p>' +
      '<div class="postFoot"><a class="readMore" href="' + a.href + '">' + t('read_more') + ' ▸</a>' +
        a.tags.map(function (t) {
          return '<a class="cf-tag" href="#" onclick="setFilter(\'tag\',\'' + esc(t) + '\'); return false;">' + esc(t) + '</a>';
        }).join('') +
      '</div></div>';
  }).join('');
  document.getElementById('postList').innerHTML =
    html || '<div class="empty">' + t('no_articles') + filterLabel() + '.</div>';

  var first = list.length ? start + 1 : 0, last = start + slice.length;
  document.getElementById('statusText').textContent =
    t('showing', { first: first, last: last, total: list.length }) + filterLabel();
  document.getElementById('clearFilter').hidden = !(state.type && state.value);
  document.getElementById('pgInfo').textContent = t('page_of', { page: state.page, pages: pages });
  document.getElementById('pgPrev').classList.toggle('disabled', state.page <= 1);
  document.getElementById('pgNext').classList.toggle('disabled', state.page >= pages);

  // keep the tree in sync with the active filter
  document.querySelectorAll('#navTree .af-treeRow').forEach(function (r) {
    r.classList.toggle('selected', (state.type === "cat" && r.dataset.cat === state.value) || (state.type === "topic" && r.dataset.topic === state.value));
  });
  document.getElementById('mainPanel').scrollTop = 0;
  window.scrollTo(0, 0);
}
function gotoPage(n) {
  var pages = Math.max(1, Math.ceil(filtered().length / PAGE_SIZE));
  if (n < 1 || n > pages) return;
  state.page = n;
  render();
}
function setFilter(type, value) {
  if (type === 'text' && value && document.getElementById('postList') && !SEARCH_INDEX) {
    state.type = type; state.value = value; state.page = 1;
    loadSearchIndex(function () { render(); }); return;
  }
  if (!document.getElementById('postList')) {   // não estamos na Home: leva o filtro para lá
    location.href = HOME_URL + (value ? '?type=' + encodeURIComponent(type) + '&value=' + encodeURIComponent(value) : '');
    return;
  }
  state.type = value ? type : "";
  state.value = value || "";
  state.page = 1;
  render();
  if (isMobile()) toggleMenu(false);   // a gaveta fecha ao escolher algo
}
function isMobile() { return window.matchMedia('(max-width: 768px)').matches; }
function toggleMenu(open) {
  var shell = document.querySelector('.af-shell');
  var on = (open === undefined) ? !shell.classList.contains('menu-open') : !!open;
  shell.classList.toggle('menu-open', on);
  document.body.classList.toggle('cf-menuOpen', on);
  var btn = document.querySelector('.cf-menuBtn');
  if (btn) btn.setAttribute('aria-expanded', on ? 'true' : 'false');
}
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggleMenu(false); });
window.matchMedia('(max-width: 768px)').addEventListener('change', function (e) { if (!e.matches) toggleMenu(false); });
function toggleAcc(id) {
  var s = document.getElementById(id);
  s.classList.toggle('collapsed');
  s.querySelector('.disc').textContent = s.classList.contains('collapsed') ? '▶' : '▼';
}
function toggleTree(id) {
  var n = document.getElementById(id);
  n.classList.toggle('closed');
  n.querySelector('.tw').innerHTML = n.classList.contains('closed') ? TW_CLOSED : TW_OPEN;
}
/* Classic [+] / [-] tree twisties (9x9 box) */
var TW_OPEN   = '<svg width="9" height="9" viewBox="0 0 9 9"><rect x="0.5" y="0.5" width="8" height="8" fill="#fff" stroke="#8a99a8"/><path d="M2.5 4.5h4" stroke="#1a3a5c" stroke-width="1"/></svg>';
var TW_CLOSED = '<svg width="9" height="9" viewBox="0 0 9 9"><rect x="0.5" y="0.5" width="8" height="8" fill="#fff" stroke="#8a99a8"/><path d="M2.5 4.5h4M4.5 2.5v4" stroke="#1a3a5c" stroke-width="1"/></svg>';

var ICO_FOLDER = '<svg width="14" height="14" viewBox="0 0 16 16"><path d="M2 4h5l1 2h6v7H2z" fill="#f2d38b" stroke="#b08f3e"/></svg>';
var ICO_DOC
var ICO_DOC    = '<svg width="14" height="14" viewBox="0 0 16 16"><path d="M4 1.5h6l3 3v10H4z" fill="#fff" stroke="#5b7a9a"/><path d="M10 1.5v3h3" fill="#d9e4ef" stroke="#5b7a9a"/></svg>';
/* Sidebar sections are generated from the catalogue, so they never drift from the data. */
function buildSidebar() {
  var cats = [];
  ARTICLES.forEach(function (a) { if (cats.indexOf(a.cat) < 0) cats.push(a.cat); });
  cats.sort(function (x, y) { return label(x).localeCompare(label(y)); });


  // content navigator: category -> (topic groups) -> articles. A topic groups related articles;
  // articles without a topic sit directly under their category.
  function leaf(a) {
    return '<li><div class="af-treeRow" title="' + esc(a.title) + '" onclick="location.href=\'' + a.href + '\'"><span class="tw"></span>' + ICO_DOC + '<span class="lbl">' + esc(a.title) + '</span></div></li>';
  }
  document.getElementById('navTree').innerHTML = cats.map(function (c, i) {
    // the tree reads like a table of contents: oldest first, the newest post at the bottom (the list on the Home is the reverse)
    var items = ARTICLES.filter(function (a) { return a.cat === c; }).slice().sort(function (x, y) { return x.iso < y.iso ? -1 : x.iso > y.iso ? 1 : 0; });
    var topics = []; items.forEach(function (a) { if (a.topic && topics.indexOf(a.topic) < 0) topics.push(a.topic); });
    var open = (i === 0);
    var inner = topics.map(function (tp, j) {
      var id = 'tn' + i + '_' + j, tItems = items.filter(function (a) { return a.topic === tp; });
      return '<li class="af-treeNode" id="' + id + '">' +
        '<div class="af-treeRow" data-topic="' + esc(tp) + '">' +
          '<span class="tw" onclick="event.stopPropagation(); toggleTree(\'' + id + '\')">' + TW_OPEN + '</span>' +
          '<span onclick="setFilter(\'topic\',\'' + esc(tp) + '\')" style="display:inline-flex; align-items:center; gap:4px;">' +
            ICO_FOLDER + esc(label(tp)) + ' <span class="tip">(' + tItems.length + ')</span></span>' +
        '</div><ul>' + tItems.map(leaf).join('') + '</ul></li>';
    }).join('') + items.filter(function (a) { return !a.topic; }).map(leaf).join('');
    return '<li class="af-treeNode' + (open ? '' : ' closed') + '" id="tn' + i + '">' +
      '<div class="af-treeRow" data-cat="' + esc(c) + '">' +
        '<span class="tw" onclick="event.stopPropagation(); toggleTree(\'tn' + i + '\')">' + (open ? TW_OPEN : TW_CLOSED) + '</span>' +
        '<span onclick="toggleTree(\'tn' + i + '\'); setFilter(\'cat\',\'' + esc(c) + '\')" style="display:inline-flex; align-items:center; gap:4px;">' +
          ICO_FOLDER + esc(label(c)) + ' <span class="tip">(' + items.length + ')</span></span>' +
      '</div><ul>' + inner + '</ul></li>';
  }).join('');

  if (!ARTICLES.length) {   // nothing published yet in this language
    ['navTree', 'tagCloud', 'archList'].forEach(function (id) { document.getElementById(id).innerHTML = '<div class="tip" style="padding:2px 4px;">' + t('nothing_yet') + '</div>'; });
    return;
  }

  // popular tags (top 10 by count)
  var counts = {};
  ARTICLES.forEach(function (a) { a.tags.forEach(function (t) { counts[t] = (counts[t] || 0) + 1; }); });
  var tags = Object.keys(counts).sort(function (x, y) { return counts[y] - counts[x] || x.localeCompare(y); }).slice(0, 10);
  document.getElementById('tagCloud').innerHTML = tags.map(function (t) {
    return '<a class="cf-tag" href="#" onclick="setFilter(\'tag\',\'' + esc(t) + '\'); return false;">' + esc(t) + ' <span class="cnt">(' + counts[t] + ')</span></a>';
  }).join('');

  // archive by month, newest first
  var months = {};
  ARTICLES.forEach(function (a) { var k = monthKey(a); months[k] = (months[k] || 0) + 1; });
  document.getElementById('archList').innerHTML = Object.keys(months).sort().reverse().map(function (k) {
    return '<div><a href="#" onclick="setFilter(\'month\',\'' + k + '\'); return false;">' + monthLabel(k) + '</a> <span class="tip">(' + months[k] + ')</span></div>';
  }).join('');
}
function selectTreeRow(row) {
  document.querySelectorAll('.af-treeRow').forEach(function (r) { r.classList.remove('selected'); });
  if (row) row.classList.add('selected');
}
function toggleDrawer(id) {
  var dr = document.getElementById(id);
  var wasOpen = dr.classList.contains('open');
  document.querySelectorAll('.af-drawer').forEach(function (d) { d.classList.remove('open', 'expanded'); });
  document.querySelectorAll('.af-drawerTab').forEach(function (t) { t.classList.remove('selected'); });
  if (!wasOpen) {
    dr.classList.add('open');
    document.getElementById(dr.dataset.tab).classList.add('selected');
  }
}
function expandDrawer(id) {
  document.getElementById(id).classList.toggle('expanded');
}
var PENDING_LANG = null;
function switchLanguage(code) {
  if (!code || code === LANG) return;
  if (CF.pageKey) {                       // numa página de artigo: existe a versão nesse idioma?
    var v = ALL_POSTS.filter(function (p) { return p.key === CF.pageKey && p.lang === code; })[0];
    if (v) { location.href = v.href; return; }
    PENDING_LANG = code;
    document.getElementById('dlgLangMsg').innerHTML = t('lang_unavailable', { lang: esc(CF.langs[code] || code) });
    document.getElementById('dlgLang').classList.add('open');
    return;
  }
  location.href = (CF.homes && CF.homes[code]) || HOME_URL;   // Home: vai para a Home do idioma
}
function goHomeInLanguage() {
  location.href = (PENDING_LANG && CF.homes && CF.homes[PENDING_LANG]) || HOME_URL;
}
function closeLangDialog() {
  document.getElementById('dlgLang').classList.remove('open');
  var sel = document.getElementById('langSelect'); if (sel) sel.value = LANG;   // volta o combo ao idioma da página
}
/* Mobile: language picker as a bottom sheet (the native select popup looks odd on phones) */
function openLangSheet()  { document.getElementById('langSheet').classList.add('open'); document.body.classList.add('cf-sheetOpen'); }
function closeLangSheet() { document.getElementById('langSheet').classList.remove('open'); document.body.classList.remove('cf-sheetOpen'); }
function pickLanguage(code) { closeLangSheet(); switchLanguage(code); }
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLangSheet(); });
/* ---------- Splitter: drag to resize the menu, click the grip to collapse ---------- */
(function () {
  var MIN = 160, MAX = 480;
  var shell = document.querySelector('.af-shell');
  var left  = document.querySelector('.af-panelLeft');
  var bar   = document.getElementById('splitter');
  var grip  = document.getElementById('splitGrip');
  var startX, startW;

  function setCollapsed(on) {
    shell.classList.toggle('collapsed', on);
    grip.innerHTML = on ? '&#9654;' : '&#9664;';
    grip.title = on ? 'Expand menu' : 'Collapse menu';
    try { localStorage.setItem('cf.menu.collapsed', on ? '1' : '0'); } catch (e) {}
  }

  grip.addEventListener('mousedown', function (e) { e.stopPropagation(); });
  grip.addEventListener('click', function (e) {
    e.stopPropagation();
    setCollapsed(!shell.classList.contains('collapsed'));
  });

  bar.addEventListener('mousedown', function (e) {
    if (shell.classList.contains('collapsed') || e.button !== 0) return;
    startX = e.clientX; startW = left.getBoundingClientRect().width;
    bar.classList.add('dragging'); document.body.classList.add('cf-resizing');
    e.preventDefault();
  });
  document.addEventListener('mousemove', function (e) {
    if (startX === undefined) return;
    var w = Math.max(MIN, Math.min(MAX, startW + (e.clientX - startX)));
    left.style.width = w + 'px';
  });
  document.addEventListener('mouseup', function () {
    if (startX === undefined) return;
    startX = undefined;
    bar.classList.remove('dragging'); document.body.classList.remove('cf-resizing');
    try { localStorage.setItem('cf.menu.width', parseInt(left.style.width, 10) || ''); } catch (e) {}
  });

  // restore the previous session's width / collapsed state, if any
  try {
    var w = parseInt(localStorage.getItem('cf.menu.width'), 10);
    if (w >= MIN && w <= MAX) left.style.width = w + 'px';
    if (localStorage.getItem('cf.menu.collapsed') === '1') setCollapsed(true);
  } catch (e) {}
})();
/* Boot: sidebar on every page; the Home list only where #postList exists (filters may come in the URL). */
buildSidebar();
if (document.getElementById('postList')) {
  var q = new URLSearchParams(location.search);
  if (q.get('type') && q.get('value')) { state.type = q.get('type'); state.value = q.get('value'); }
  if (q.get('q')) { state.type = 'text'; state.value = q.get('q'); }
  if (state.type === 'text') { var sb = document.getElementById('searchBox'); if (sb) sb.value = state.value; }
  render();
  loadSearchIndex(function () { if (state.type === 'text') render(); });   // conteúdo completo entra na busca quando o índice chega
}

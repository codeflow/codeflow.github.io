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
  '/manifest.webmanifest'
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
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function isAsset(url) {
  return /\.(css|js|png|jpg|jpeg|gif|svg|ico|json|webmanifest|woff2?)$/.test(url.pathname);
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') >= 0) {
    event.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) { return hit || caches.match(OFFLINE); });
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

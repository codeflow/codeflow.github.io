// Service Worker for Codeflow PWA
const CACHE_NAME = 'codeflow-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/content/en/welcome.html',
  '/content/br/welcome.html',
  '/resources/css/themes/bluesky/theme.css',
  '/resources/js/main.js',
  '/resources/js/menu.js',
  '/resources/js/i18n.js',
  '/resources/js/hash.js',
  '/resources/js/sidebar.js',
  '/resources/js/content.js',
  '/resources/js/tree.js',
  '/resources/js/search.js',
  '/resources/js/index-page.js',
  '/resources/js/welcome-data.js',
  '/resources/img/codeflow.png',
  '/resources/db/menu.json',
  '/resources/db/search.json',
  '/resources/db/statistics.json',
  '/resources/db/updates.json'
];

// Service Worker Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Service Worker: Erro ao fazer cache', error);
      })
  );
  // Force immediate activation of the new Service Worker
  self.skipWaiting();
});

// Service Worker Activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Removendo cache antigo', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Assume immediate control of all pages
  return self.clients.claim();
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Estratégia: Cache First para HTML, Network First para outros recursos
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          // Se é uma requisição HTML, prioriza cache
          if (request.destination === 'document' || url.pathname.endsWith('.html')) {
            if (cachedResponse) {
              // Retorna do cache e atualiza em background
              fetch(request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                  const responseToCache = networkResponse.clone();
                  caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, responseToCache);
                  });
                }
              }).catch(() => {
                // Ignora erros de rede em background
              });
              return cachedResponse;
            }
            // Se não está em cache, busca da rede e cacheia
            return fetch(request).then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, responseToCache);
                });
              }
              return networkResponse;
            }).catch(() => {
              // Se falhar, tenta retornar index.html como fallback
              if (request.destination === 'document') {
                return caches.match('/index.html');
              }
            });
          } else {
            // Para outros recursos (CSS, JS, imagens, JSON), usa Cache First
            if (cachedResponse) {
              return cachedResponse;
            }
            // Se não está em cache, busca da rede e cacheia
            return fetch(request).then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, responseToCache);
                });
              }
              return networkResponse;
            });
          }
        })
        .catch(() => {
          // Fallback: retorna index.html para requisições de documento
          if (request.destination === 'document') {
            return caches.match('/index.html');
          }
        })
    );
  }
});

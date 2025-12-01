// Updated service-worker to force new cache version
const CACHE_NAME = 'wms-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/app.js',
  '/style.css',
  '/manifest.json',
  '/favicon.ico'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .catch(err => console.error('SW install failed', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  // prefer network for API calls, cache for static assets
  if (req.url.includes('/exec') || req.method !== 'GET') {
    event.respondWith(fetch(req).catch(()=>caches.match(req)));
    return;
  }
  event.respondWith(
    caches.match(req).then(cached => {
      return cached || fetch(req).then(resp => {
        // optionally cache fetched asset
        return resp;
      }).catch(()=>caches.match('/index.html'));
    })
  );
});

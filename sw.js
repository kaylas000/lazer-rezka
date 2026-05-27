// Service Worker — PWA offline support v1.0
const CACHE_NAME = 'lazer-rezka-v2';
const STATIC_ASSETS = [
  '/',
  '/assets/css/main.css',
  '/assets/js/main.js',
  '/assets/images/icon-192.png',
  '/assets/images/icon-512.png',
  '/favicon.ico',
  '/favicon.svg',
  '/offline/'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Пропускаем видео — слишком большие для кеша
  if (/\.(mp4|webm|mov|avi)$/i.test(event.request.url)) return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      var fetchPromise = fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          try {
            var clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          } catch(e) {}
        }
        return response;
      }).catch(function() { return cached; });
      return cached || fetchPromise;
    })
  );
});

const CACHE_NAME = 'rezero-reader-v1';
const urlsToCache = [
  '/Re-zero/',
  '/Re-zero/index.html',
  '/Re-zero/reader.html',
  '/Re-zero/style.css',
  '/Re-zero/script.js',
  '/Re-zero/manifest.json',
  '/Re-zero/chapters.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => key !== CACHE_NAME && caches.delete(key))
    ))
  );
});
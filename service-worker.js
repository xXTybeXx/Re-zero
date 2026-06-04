const CACHE_NAME = 'rezero-reader-v1';
const urlsToCache = [
  '/rezero-reader/',
  '/rezero-reader/index.html',
  '/rezero-reader/reader.html',
  '/rezero-reader/style.css',
  '/rezero-reader/script.js',
  '/rezero-reader/manifest.json',
  '/rezero-reader/chapters.json'
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
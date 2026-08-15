/**
 * POCKETSLY SERVICE WORKER (sw.js)
 * =================================
 * Offline Resilience & Sub-Millisecond Caching Engine
 */

// Cache name is derived from the bundle ?v= version so every release installs
// a fresh cache and the old one is purged on activate. If this ever grows a
// version string, it changes — the SW would serve a stale app shell otherwise.
const BUNDLE_JS = '/js/bundle.js?v=8.4';
const CACHE_NAME = 'pocketsly-cache-' + BUNDLE_JS.split('v=')[1];
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/bundle.css?v=8.4',
  BUNDLE_JS,
  // Async-loaded font stylesheet; runtime caching covers the woff2 files it
  // references. cache.addAll tolerates a failure here (catch below) so a
  // first install while offline still succeeds.
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
  '/img/pocketsly-icon-192.png',
  '/img/pocketsly-icon-512.png',
  '/img/favicon.ico'
];

// OCR vendor files (tesseract.min.js, worker, wasm core, eng.traineddata.gz) are
// intentionally NOT precached: they are lazy-loaded only when the receipt scanner
// is used and are cached at runtime by the stale-while-revalidate handler below.
// This keeps install fast and reliable instead of downloading ~15MB up front.

// Install Event: Pre-cache shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('SW pre-cache warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Smart Cache-First for assets, Network-First for API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. API Calls: Network-First Strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }

  // 2. Static Assets & Pages: Stale-While-Revalidate Strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

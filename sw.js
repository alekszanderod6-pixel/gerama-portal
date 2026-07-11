// GERAMA Service Worker – enables PWA install prompt and offline caching
const CACHE_NAME = 'gerama-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/about.html',
  '/resources.html',
  '/contact.html',
  '/login.html',
  '/signup.html',
  '/dashboard.html',
  '/classroom.html',
  '/mall.html',
  '/help.html',
  '/css/style.css',
  '/js/main.js',
  '/js/resources.js',
  '/js/supabase-config.js',
  '/js/gerama-features.js',
  '/js/onesignal-init.js',
  '/images/geramalogo.jpg',
  '/images/uenr logo.png',
  '/images/aleks.jpg',
  '/manifest.json'
];

// Install: cache static assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    }).catch(function(err) {
      console.log('SW install cache error (non-fatal):', err);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first for HTML/JS, cache-first for images/CSS
self.addEventListener('fetch', function(event) {
  // Only handle same-origin or GitHub raw requests
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;

  // For navigation requests (HTML pages) – network first, fallback to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(function() {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // For everything else – stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      const networkFetch = fetch(event.request).then(function(response) {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(function() { return cached; });
      return networkFetch.catch(function() {
        return cached || fetch(event.request);
      });
    })
  );
});

// Handle offline/online status messages
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

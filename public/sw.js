const CACHE_NAME = 's4-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/favicon.svg',
    '/logo.svg'
];

// Install service worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

// Activate service worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone the response
                const responseToCache = response.clone();

                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});

// BIET Service Worker
const CACHE_NAME = 'biet-v6.5';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css?v=6.5',
  '/app.js?v=6.5.0',
  '/biet-logo.png',
  '/biet-emblem-raw.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell v3.1');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Let API calls bypass cache and go straight to network
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Network-first strategy for app logic & styles so updates are instant, with offline cache fallback
  if (event.request.url.includes('/app.js') || event.request.url.includes('/style.css') || event.request.url.endsWith('/') || event.request.url.includes('index.html')) {
    event.respondWith(
      fetch(event.request)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          }
          return networkRes;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Push notifications support
self.addEventListener('push', (event) => {
  let data = { title: 'BIET Alert Hub', body: 'New campus bulletin released.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch(e) {
      data.body = event.data.text();
    }
  }
  const options = {
    body: data.body,
    icon: 'https://img.icons8.com/fluency/192/university.png',
    badge: 'https://img.icons8.com/fluency/96/alarm.png',
    vibrate: [200, 100, 200, 100, 300],
    data: { url: '/' }
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

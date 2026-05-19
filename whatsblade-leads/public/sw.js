const CACHE_NAME = 'whatsblade-leads-v1';
const OFFLINE_CACHE = 'whatsblade-offline-v1';
const API_CACHE = 'whatsblade-api-v1';

const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/dashboard/discover',
  '/dashboard/pipeline',
  '/dashboard/leads',
  '/dashboard/campaigns',
  '/dashboard/messages',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/favicon.ico',
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
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== OFFLINE_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (url.pathname.startsWith('/api/trpc') || url.pathname.startsWith('/api/search')) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          const cached = await cache.match(request);
          if (cached) return cached;
          return new Response(
            JSON.stringify({ error: 'Offline — showing cached data' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        }
      })
    );
    return;
  }

  if (request.destination === 'document') {
    event.respondWith(
      caches.match(request).then((cached) => {
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => cached || caches.match('/dashboard'));
      })
    );
    return;
  }

  if (['image', 'style', 'script', 'font'].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((cached) =>
        fetch(request).then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        }).catch(() => cached)
      )
    );
    return;
  }
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Whatsblade Leads', body: event.data.text() };
  }

  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag || 'default',
    data: data.data || {},
    actions: data.actions || [],
    renotify: true,
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(self.registration.showNotification(data.title || 'Whatsblade Leads', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.link || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'CACHE_LEADS') {
    event.waitUntil(
      caches.open(OFFLINE_CACHE).then((cache) => cache.put('/api/offline/leads', new Response(JSON.stringify(event.data.leads))))
    );
  }
  if (event.data?.type === 'GET_CACHED_LEADS') {
    event.waitUntil(
      caches.open(OFFLINE_CACHE).then(async (cache) => {
        const response = await cache.match('/api/offline/leads');
        const leads = response ? await response.json() : [];
        event.source?.postMessage({ type: 'CACHED_LEADS', leads });
      })
    );
  }
});

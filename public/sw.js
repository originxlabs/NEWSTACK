/// <reference lib="webworker" />

// Version bump triggers cache refresh for installed PWA
const CACHE_VERSION = 'v3';
const CACHE_NAME = `newstack-${CACHE_VERSION}`;
const OFFLINE_CACHE_NAME = `newstack-offline-${CACHE_VERSION}`;
const ARTICLES_CACHE_NAME = `newstack-articles-${CACHE_VERSION}`;

// Core assets to cache immediately
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg',
  '/favicon.ico',
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('newstack-') && name !== CACHE_NAME && name !== OFFLINE_CACHE_NAME && name !== ARTICLES_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests except for images
  if (url.origin !== location.origin && !request.url.includes('image')) {
    return;
  }

  // Handle API requests (Supabase functions) - network only with timeout
  if (url.pathname.includes('/functions/') || url.pathname.includes('/rest/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // Handle saved articles - cache first
  if (url.pathname.includes('/saved-article/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request);
      })
    );
    return;
  }

  // Handle images - cache first, then network
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        }).catch(() => {
          // Return placeholder for failed images
          return new Response('', { status: 404 });
        });
      })
    );
    return;
  }

  // Handle navigation requests - network first, cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => {
          return caches.match('/') || caches.match('/index.html');
        })
    );
    return;
  }

  // Default - stale while revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});

// Handle messages for saving articles offline
self.addEventListener('message', (event) => {
  if (event.data.type === 'SAVE_ARTICLE_OFFLINE') {
    const { article } = event.data;
    caches.open(ARTICLES_CACHE_NAME).then((cache) => {
      const response = new Response(JSON.stringify(article), {
        headers: { 'Content-Type': 'application/json' },
      });
      cache.put(`/saved-article/${article.id}`, response);
    });
  }

  if (event.data.type === 'REMOVE_ARTICLE_OFFLINE') {
    const { articleId } = event.data;
    caches.open(ARTICLES_CACHE_NAME).then((cache) => {
      cache.delete(`/saved-article/${articleId}`);
    });
  }

  if (event.data.type === 'GET_OFFLINE_ARTICLES') {
    caches.open(ARTICLES_CACHE_NAME).then(async (cache) => {
      const keys = await cache.keys();
      const articles = await Promise.all(
        keys.map(async (request) => {
          const response = await cache.match(request);
          if (response) {
            return response.json();
          }
          return null;
        })
      );
      event.ports[0].postMessage({ articles: articles.filter(Boolean) });
    });
  }

  // Handle skip waiting message
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push notification handler - works on both iOS (Safari 16.4+) and Android
self.addEventListener('push', (event) => {
  let data = { title: 'NEWSTACK', body: 'New stories available!' };
  
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.error('Error parsing push data:', e);
  }

  const options = {
    body: data.body || 'Check out the latest news!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100, 50, 100],
    tag: data.tag || 'newstack-notification',
    renotify: true,
    requireInteraction: false,
    silent: false,
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
    },
    actions: [
      { action: 'open', title: 'Read Now' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'NEWSTACK', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data || {};

  if (action === 'dismiss') {
    return;
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (notificationData.url && notificationData.url !== '/') {
            client.navigate(notificationData.url);
          }
          return;
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(notificationData.url || '/');
      }
    })
  );
});

// Background sync for bookmarks
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-bookmarks') {
    event.waitUntil(syncBookmarks());
  }
});

async function syncBookmarks() {
  // Sync offline bookmarks when back online
  const cache = await caches.open(ARTICLES_CACHE_NAME);
  const keys = await cache.keys();
  
  // This would sync with the server when implementing
  console.log('Syncing', keys.length, 'offline articles');
}

// Periodic background sync for fresh content (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-news') {
    event.waitUntil(updateNewsCache());
  }
});

async function updateNewsCache() {
  try {
    // Fetch latest news and cache it
    const response = await fetch('/api/news?limit=20');
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put('/api/news?limit=20', response);
    }
  } catch (e) {
    console.log('Background sync failed:', e);
  }
}

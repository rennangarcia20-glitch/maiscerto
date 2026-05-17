// + Certo Mogi Guaçu — Service Worker
const CACHE_NAME = 'maiscerto-v1';
const ASSETS = [
  '/maiscerto/',
  '/maiscerto/index.html',
  '/maiscerto/manifest.json',
  '/maiscerto/icon-192.png',
  '/maiscerto/icon-512.png'
];

// Install — cache assets
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', function(e) {
  // Don't cache Supabase or GitHub API requests
  if (e.request.url.includes('supabase.co') ||
      e.request.url.includes('api.github.com')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(function(res) {
        // Cache fresh response
        if (res && res.status === 200 && e.request.method === 'GET') {
          var resClone = res.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, resClone);
          });
        }
        return res;
      })
      .catch(function() {
        // Network failed — serve from cache
        return caches.match(e.request).then(function(cached) {
          return cached || caches.match('/maiscerto/');
        });
      })
  );
});

// Push notifications
self.addEventListener('push', function(e) {
  var data = e.data ? e.data.json() : {};
  var title = data.title || '+ Certo Mogi Guaçu';
  var options = {
    body: data.body || 'Nova atualização disponível',
    icon: '/maiscerto/icon-192.png',
    badge: '/maiscerto/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: '/maiscerto/' },
    actions: [
      { action: 'open', title: 'Abrir App' },
      { action: 'close', title: 'Fechar' }
    ]
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// Notification click
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  if (e.action === 'open' || !e.action) {
    e.waitUntil(
      clients.matchAll({ type: 'window' }).then(function(cls) {
        for (var i = 0; i < cls.length; i++) {
          if (cls[i].url.includes('maiscerto') && 'focus' in cls[i]) {
            return cls[i].focus();
          }
        }
        return clients.openWindow('/maiscerto/');
      })
    );
  }
});

// Background sync
self.addEventListener('sync', function(e) {
  if (e.tag === 'sync-producao') {
    e.waitUntil(syncProducao());
  }
});

function syncProducao() {
  return self.clients.matchAll().then(function(cls) {
    cls.forEach(function(client) {
      client.postMessage({ type: 'SYNC_REQUESTED' });
    });
  });
}

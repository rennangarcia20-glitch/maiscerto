// + Certo Mogi Guaçu — Service Worker v2
const CACHE = 'maiscerto-v2';

// Install - skip waiting immediately
self.addEventListener('install', function(e) {
  self.skipWaiting();
});

// Activate - claim clients
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

// Fetch - only cache static assets, pass through everything else
self.addEventListener('fetch', function(e) {
  var url = e.request.url;
  
  // Pass through: API calls, Supabase, GitHub
  if (url.includes('supabase.co') || 
      url.includes('api.github.com') ||
      url.includes('gist') ||
      e.request.method !== 'GET') {
    return;
  }
  
  // For HTML/JS/CSS/images: network first, cache fallback
  e.respondWith(
    fetch(e.request)
      .then(function(res) {
        if (res && res.ok) {
          var clone = res.clone();
          caches.open(CACHE).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return res;
      })
      .catch(function() {
        return caches.match(e.request);
      })
  );
});

// Push notifications
self.addEventListener('push', function(e) {
  var data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || '+ Certo', {
      body: data.body || 'Nova atualização',
      icon: '/maiscerto/icon-192.png',
      badge: '/maiscerto/icon-192.png',
      vibrate: [200, 100, 200]
    })
  );
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(clients.openWindow('/maiscerto/'));
});

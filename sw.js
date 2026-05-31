// Evolui B1 Service Worker v3
const CACHE = 'evoluib1-v3';

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

// Network only for HTML (always fresh), cache for assets
self.addEventListener('fetch', function(e) {
  var url = e.request.url;
  
  // Always fetch fresh: HTML, Supabase, APIs
  if (url.includes('supabase.co') || 
      url.includes('api.github.com') || 
      url.endsWith('.html') ||
      url.endsWith('/') ||
      e.request.method !== 'GET') {
    return; // no caching
  }
  
  // Cache images/icons
  e.respondWith(
    fetch(e.request).then(function(res) {
      if (res && res.ok && (url.includes('.png') || url.includes('.json'))) {
        var clone = res.clone();
        caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
      }
      return res;
    }).catch(function() { return caches.match(e.request); })
  );
});

self.addEventListener('push', function(e) {
  var data = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(data.title || 'Evolui B1', {
    body: data.body || 'Nova atualização',
    icon: '/maiscerto/icon-192.png'
  }));
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(clients.openWindow('/maiscerto/'));
});
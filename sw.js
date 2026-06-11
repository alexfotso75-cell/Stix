/* GraceLink Service Worker — cache-first pour l'app shell, offline support */
const CACHE = 'gracelink-v7.0';
const SHELL  = ['/', '/index.html'];

// ── Installation : mise en cache de l'app shell ───────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

// ── Activation : nettoyage des anciens caches ────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch : stratégie selon la ressource ─────────────────────────────────
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Laisser Firebase gérer ses propres requêtes (Firestore, Auth, Storage)
  if (url.includes('googleapis.com')   ||
      url.includes('firebaseio.com')   ||
      url.includes('identitytoolkit')  ||
      url.includes('firebasestorage')  ||
      url.includes('gstatic.com')      ||
      url.includes('firebaseapp.com')) {
    return;
  }

  // Pour les navigations (HTML) : réseau d'abord, cache en fallback
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Pour le reste : cache d'abord (assets, icônes, manifest…)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Fallback générique pour les ressources manquantes
        if (e.request.destination === 'image') return new Response('', { status: 404 });
      });
    })
  );
});

// ── Push notifications (background) ──────────────────────────────────────
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'GraceLink', body: 'Nouveau message' };
  e.waitUntil(
    self.registration.showNotification(data.title || 'GraceLink', {
      body:  data.body  || 'Vous avez un nouveau message',
      icon:  '/icons/icon.svg',
      badge: '/icons/icon.svg',
      tag:   data.tag   || 'gracelink-msg',
      data:  data.url   || '/',
      vibrate: [200, 100, 200]
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(wins => {
      const existing = wins.find(w => w.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return clients.openWindow(e.notification.data || '/');
    })
  );
});

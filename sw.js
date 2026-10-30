// Assistant Incendie — cache applicatif V3.6.3 (sans accès au coffre IndexedDB)
const CACHE = 'assistant-incendie-v3-6-3-static-1';
const FILES = ['./', './index.html', './manifest.webmanifest'];
const SCOPE = new URL(self.registration.scope);
const ALLOWED = new Set(FILES.map(f => new URL(f, SCOPE).href));

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(name => name.startsWith('assistant-incendie-') && name !== CACHE)
        .map(name => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  // Ne pas intercepter ni mettre en cache les pages de test, les PDF et les autres documents.
  if (request.method !== 'GET' || !ALLOWED.has(request.url)) return;
  event.respondWith(
    fetch(request).then(response => {
      if (response.ok && response.type === 'basic') {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)));
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      throw new Error('Ressource indisponible hors connexion');
    })
  );
});

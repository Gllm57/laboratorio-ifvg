// Modo sin conexión para GitHub Pages: guarda la app y responde desde caché si no hay red.
const CACHE = 'lab-ifvg-v16';
const FILES = ['./', 'index.html', 'engine.js', 'charts.js', 'content.js', 'teoria1.js', 'teoria2.js', 'teoria3.js', 'diagrams.js', 'glosario.js', 'config.js', 'app.js', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // red primero (para recibir actualizaciones), caché si falla
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); if (r.ok && new URL(e.request.url).origin === location.origin) caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
});

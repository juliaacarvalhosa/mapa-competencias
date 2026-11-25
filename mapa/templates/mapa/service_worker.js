const cacheName = 'mapa-competencias-v1';
const pages = ['/', '/alternativa_ux'];
const assets = [
  'app.webmanifest',
  'css/app.css', 'css/alternative_ux.css', 'css/compact_lists.css',
  'js/app.js', 'js/alternative_ux.js', 'js/compact_lists.js', 'js/pwa.js',
  'img/icon-firjan.jpeg', 'img/logo-senai-sesi-transparente.png',
  'img/qr-mapa.svg', 'img/textura-header.jpg',
  'img/app-180.png', 'img/app-192.png', 'img/app-512.png'
].map(path => '/static/mapa/' + path);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll([...pages, ...assets])));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('mapa-competencias-') && name !== cacheName)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  const isPage = request.mode === 'navigate' && pages.includes(url.pathname);
  if (!isPage && !assets.includes(url.pathname)) return;

  event.respondWith((async () => {
    // Both HTML views resolve their query parameters on the client.
    const key = url.pathname;
    let response;
    try {
      response = await fetch(request);
    } catch (error) {
      const saved = await caches.match(key, {cacheName, ignoreVary: true});
      if (saved) return saved;
      throw error;
    }
    if (response.ok && !response.redirected) {
      const copy = response.clone();
      event.waitUntil(caches.open(cacheName).then(cache => cache.put(key, copy)).catch(() => {}));
    }
    return response;
  })());
});

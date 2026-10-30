/* Tareeq offline worker.
   Page: network first, so updates arrive whenever you're online; falls back to the saved copy offline.
   Fonts, icons, images: saved once, served from the device. Bump VERSION when those files change. */
var VERSION = 'tareeq-v5';
var CORE = ['./', 'index.html', 'fonts/fonts.css', 'manifest.webmanifest',
  'fonts/inter-latin-300-normal.woff2', 'fonts/inter-latin-400-normal.woff2',
  'fonts/inter-latin-500-normal.woff2', 'fonts/inter-latin-600-normal.woff2',
  'fonts/dm-serif-display-latin-400-normal.woff2', 'fonts/dm-serif-display-latin-400-italic.woff2',
  'fonts/noto-naskh-arabic-arabic-400-normal.woff2', 'fonts/noto-naskh-arabic-arabic-500-normal.woff2',
  'fonts/tabler-icons-sub.woff2', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req, { cache: 'no-store' }).then(function (res) {
        if (res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put('index.html', copy); }); }
        return res;
      }).catch(function () {
        return caches.match('index.html').then(function (r) { return r || caches.match('./'); });
      })
    );
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (hit) {
    return hit || fetch(req).then(function (res) {
      if (res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
      return res;
    });
  }));
});

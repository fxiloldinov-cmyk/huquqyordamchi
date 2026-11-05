// Service worker: faqat statik interfeys keshlanadi.
// HECH QACHON keshlanmaydi: /api/* (AI, hisob, sessiya, ishlar, kitoblar), POST so'rovlar, boshqa domenlar.
// Shaxsiy kazuslar va AI javoblari faqat foydalanuvchi "qurilmada saqlash"ni tanlasa localStorage'da (workspace.js), SW'da emas.
// Versiya build paytida yangilanadi (scripts/build-data.mjs → SW_VERSION).
const SW_VERSION = 'hk-v11.11.0-526b85c1cc';
const STATIC = `hk-static-${SW_VERSION}`;
const SHELL = [
  '/', '/index.html', '/offline.html', '/styles.css', '/premium.css', '/suite.js', '/voice.js', '/voice-core.js', '/voice.css', '/manifest.webmanifest',
  '/legal-data.js', '/legal-core.js', '/templates.js', '/app.js', '/features.js', '/explain.js', '/ui.js', '/motion.js',
  '/consent.js', '/workspace.js', '/coverage.js', '/accounts.js', '/i18n.js', '/pwa.js', '/coverage.json',
  '/assets/favicon.svg', '/assets/icon-192.png', '/assets/icon-512.png', '/assets/icon-maskable-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(STATIC);
    // cache: 'reload' — brauzerning HTTP keshidagi eski nusxa yangi versiya keshiga tushmasin
    await c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })));
    // Keshlangan sana: oflayn sahifada "saqlangan nusxa" sifatida ko'rsatiladi (amaldagi deb emas)
    await c.put('/__hk_cache_meta', new Response(JSON.stringify({ version: SW_VERSION, cachedAt: new Date().toISOString() }), { headers: { 'Content-Type': 'application/json' } }));
  })());
  // Yangi versiya o'zi faollashmaydi: sahifa foydalanuvchiga taklif qiladi (yozilayotgan matn yo'qolmasligi uchun)
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('hk-static-') && k !== STATIC) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
  // Hisobdan chiqishda: shaxsiy narsa keshda yo'q, lekin ehtiyot uchun runtime keshni tozalaymiz
  if (e.data === 'CLEAR_PRIVATE') e.waitUntil(caches.delete('hk-runtime'));
});

const isPrivate = (url, req) => req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/.netlify/');

self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (isPrivate(url, req)) return; // brauzerning oddiy tarmoq so'rovi, keshsiz
  if (url.pathname === '/__hk_cache_meta') { e.respondWith(caches.match('/__hk_cache_meta').then((r) => r || new Response('{}', { headers: { 'Content-Type': 'application/json' } }))); return; }
  // Sahifalar: avval tarmoq (yangi kontent), tarmoq bo'lmasa — keshdagi interfeys yoki oflayn sahifa
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try { return await fetch(req); }
      catch { return (await caches.match(url.pathname === '/' ? '/index.html' : url.pathname)) || (await caches.match('/offline.html')); }
    })());
    return;
  }
  // Statik fayllar: keshdan tez, fonda yangilanadi (faqat SHELL ro'yxatidagilar)
  if (SHELL.includes(url.pathname)) {
    e.respondWith((async () => {
      const cache = await caches.open(STATIC), hit = await cache.match(url.pathname);
      const net = fetch(req, { cache: 'no-cache' }).then((r) => { if (r.ok && r.type === 'basic') cache.put(url.pathname, r.clone()); return r; }).catch(() => null);
      return hit || (await net) || new Response('', { status: 504 });
    })());
  }
});

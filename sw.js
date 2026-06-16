/* FOR HOUSE — Service Worker
   Enables PWA installability + offline shell caching
   Cache name must be updated when app version bumps
   ============================================================ */

const CACHE_NAME = 'fh-v34';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/styles.css?v=34',
  '/config.js?v=34',
  '/db.js?v=34',
  '/data.js?v=34',
  '/data-projects.js?v=34',
  '/components.jsx?v=34',
  '/po.jsx?v=34',
  '/documents.jsx?v=34',
  '/income-plan.jsx?v=34',
  '/screens.jsx?v=34',
  '/app.jsx?v=34',
  '/assets/forhouse-logo.jpg',
  '/assets/icon.svg'
];

// ── Install: pre-cache app shell ──────────────────────────────
self.addEventListener('install', ev => {
  ev.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: remove old caches ───────────────────────────────
self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => clients.claim())
  );
});

// ── Fetch strategy ────────────────────────────────────────────
//  • HTML / navigation (index.html, '/') → NETWORK-FIRST
//      เอกสารหลักต้องสดเสมอ เพื่อให้ได้ <script src=...?v=NN> ล่าสุด
//      มิฉะนั้นการอัปเดตจะไม่ขึ้นจนกว่าจะ bust cache เอง
//  • Versioned assets (?v=NN) + รูป → CACHE-FIRST + background refresh
//      ไฟล์เหล่านี้ immutable ต่อเวอร์ชัน จึงปลอดภัยที่จะเสิร์ฟจาก cache
self.addEventListener('fetch', ev => {
  const { request } = ev;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Don't intercept cross-origin requests (CDN: React, Babel, Supabase, Fonts)
  if (url.origin !== self.location.origin) return;

  const isHTML = request.mode === 'navigate' ||
                 url.pathname === '/' ||
                 url.pathname.endsWith('/index.html') ||
                 url.pathname.endsWith('.html');

  // ── NETWORK-FIRST for HTML documents ──
  if (isHTML) {
    ev.respondWith(
      fetch(request)
        .then(res => {
          if (res && res.ok && res.type === 'basic') {
            caches.open(CACHE_NAME).then(cache => cache.put(request, res.clone()));
          }
          return res;
        })
        .catch(() =>
          caches.open(CACHE_NAME).then(cache =>
            cache.match(request).then(cached =>
              cached || cache.match('/index.html') || new Response(
                '<h1>FOR HOUSE — ไม่มีสัญญาณอินเทอร์เน็ต</h1>',
                { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
              )
            )
          )
        )
    );
    return;
  }

  // ── CACHE-FIRST (stale-while-revalidate) for everything else ──
  ev.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(request).then(cached => {
        const networkFetch = fetch(request)
          .then(res => {
            if (res && res.ok && res.type === 'basic') {
              cache.put(request, res.clone());
            }
            return res;
          })
          .catch(() => null);

        if (cached) {
          networkFetch.catch(() => {}); // silent background update
          return cached;
        }
        return networkFetch.then(res =>
          res || new Response('<h1>FOR HOUSE — ไม่มีสัญญาณอินเทอร์เน็ต</h1>', {
            status: 503,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          })
        );
      })
    )
  );
});

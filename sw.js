/* FOR HOUSE — Service Worker
   Enables PWA installability + offline shell caching
   Cache name must be updated when app version bumps
   ============================================================ */

const CACHE_NAME = 'fh-v31';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/styles.css?v=31',
  '/config.js?v=31',
  '/db.js?v=31',
  '/data.js?v=31',
  '/data-projects.js?v=31',
  '/components.jsx?v=31',
  '/po.jsx?v=31',
  '/documents.jsx?v=31',
  '/income-plan.jsx?v=31',
  '/screens.jsx?v=31',
  '/app.jsx?v=31',
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

// ── Fetch: cache-first for local files, pass-through for CDN ──
self.addEventListener('fetch', ev => {
  const { request } = ev;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Don't intercept cross-origin requests (CDN: React, Babel, Supabase, Fonts)
  if (url.origin !== self.location.origin) return;

  ev.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(request).then(cached => {
        // Always try network in background to keep cache fresh
        const networkFetch = fetch(request)
          .then(res => {
            if (res && res.ok && res.type === 'basic') {
              cache.put(request, res.clone());
            }
            return res;
          })
          .catch(() => null);

        // Return cached immediately if available; otherwise wait for network
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

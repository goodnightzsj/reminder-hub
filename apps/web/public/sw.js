// Reminder Hub Service Worker
// Bump CACHE_VERSION to invalidate old caches on deploy.
const CACHE_VERSION = "rh-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Assets pre-cached on install. Keep minimal - everything else is cached
// on first use via runtime cache.
const PRECACHE_URLS = [
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(CACHE_VERSION))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Network-first for HTML + API (always fresh data when online, cache fallback offline).
// Cache-first for static assets (fast, Next.js hashes filenames so stale cache is safe).
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests; let POST/PUT/DELETE pass through to network.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Don't cache cross-origin requests (e.g., fonts.googleapis.com, iconify).
  if (url.origin !== self.location.origin) return;

  // Don't cache API endpoints (except simple GETs can be added here later).
  if (url.pathname.startsWith("/api/")) return;

  // Hashed static assets: cache-first.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML documents and everything else: network-first with cache fallback.
  event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Offline with no cache - return a minimal fallback page.
    if (request.mode === "navigate") {
      return new Response(
        "<!doctype html><meta charset=utf-8><title>离线</title><body style=\"font-family:system-ui;padding:2rem;text-align:center\"><h1>当前处于离线状态</h1><p>请在有网络时重新访问本页。</p></body>",
        { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 503 },
      );
    }
    throw new Error("offline");
  }
}

// Listen for skipWaiting message from client (manual update trigger).
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

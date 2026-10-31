/* ============================================================
 * YonuKom — Service Worker (PWA)
 * Stratégies:
 *   - precache: app shell (HTML/CSS/JS de base + assets statiques)
 *   - network-first: API (/api/*) — fallback cache si offline
 *   - cache-first: assets statiques (images, fonts, _next/static)
 *   - cleanup: on active, supprime les anciens caches
 * ============================================================ */

const VERSION = "yonukom-v1";
const APP_SHELL_CACHE = `${VERSION}-app-shell`;
const ASSETS_CACHE = `${VERSION}-assets`;
const API_CACHE = `${VERSION}-api`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

const ALL_CACHES = [APP_SHELL_CACHE, ASSETS_CACHE, API_CACHE, RUNTIME_CACHE];

// App shell minimal — les autres assets seront mis en cache à la volée.
const APP_SHELL_URLS = [
  "/",
  "/manifest.json",
  "/logo.svg",
];

// --- INSTALL : precache app shell ---
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_SHELL_CACHE);
      try {
        await cache.addAll(APP_SHELL_URLS);
      } catch (err) {
        // Certaines URL peuvent échouer (ex: / non disponible hors dev)
        // On ne fait pas échouer l'installation pour autant.
        console.warn("[SW] precache partiel:", err);
      }
      // Active immédiatement le nouveau SW sans attendre la fermeture des onglets
      self.skipWaiting();
    })()
  );
});

// --- ACTIVATE : cleanup old caches + take control ---
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => !ALL_CACHES.includes(key))
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

// --- FETCH : route requests based on URL ---
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Ignore non-GET (POST/PUT/DELETE ne sont pas mis en cache)
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Skip chrome-extension and other protocols
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  const sameOrigin = url.origin === self.location.origin;
  const isAPI = url.pathname.startsWith("/api/");
  const isStaticAsset =
    sameOrigin &&
    (url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/_next/image") ||
      /\.(?:png|jpe?g|webp|svg|gif|ico|woff2?|ttf|eot|css|js)(?:\?|$)/i.test(
        url.pathname
      ));

  // 1) API → network-first, fallback cache
  if (isAPI) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // 2) Static assets (same origin) → cache-first
  if (isStaticAsset) {
    event.respondWith(cacheFirst(request, ASSETS_CACHE));
    return;
  }

  // 3) Same-origin navigation/document → network-first, fallback app shell
  if (sameOrigin && request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          // Cache the latest version of the page
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, fresh.clone());
          return fresh;
        } catch {
          // Offline → try cached response, then fall back to app shell
          const cached = await caches.match(request);
          if (cached) return cached;
          const shell = await caches.match("/");
          if (shell) return shell;
          return new Response("Hors ligne — YonuKom", {
            status: 503,
            statusText: "Offline",
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        }
      })()
    );
    return;
  }

  // 4) Other same-origin GETs → stale-while-revalidate
  if (sameOrigin) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }

  // 5) Cross-origin (Google Fonts, etc.) → cache-first with limited TTL
  event.respondWith(cacheFirst(request, RUNTIME_CACHE));
});

// --- Strategies ---

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) {
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch {
    return new Response("", { status: 504, statusText: "Gateway Timeout" });
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(request);
    // Cache successful GET responses (avoid caching errors)
    if (fresh && (fresh.ok || fresh.status === 0)) {
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((fresh) => {
      if (fresh && (fresh.ok || fresh.status === 0)) {
        cache.put(request, fresh.clone());
      }
      return fresh;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

// --- MESSAGE: skipWaiting from page ---
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

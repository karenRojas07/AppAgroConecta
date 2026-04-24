/*
 * AgroConecta · Service Worker
 *
 *  Eventos base:
 *   1. install  → precarga del "app shell" mínimo.
 *   2. activate → limpieza de cachés antiguos.
 *   3. fetch    → intercepción de peticiones + estrategias por tipo.
 *
 *  Estrategias:
 *   - /api/   → network-first (datos frescos; cae a caché si no hay red).
 *   - imágenes → stale-while-revalidate (render rápido, actualiza en background).
 *   - navegación (HTML) → network-first con fallback a /index.html (SPA).
 *   - assets estáticos (js/css/fuentes) → cache-first.
 */

const VERSION = "v1.0.0";
const SHELL_CACHE = `ac-shell-${VERSION}`;
const API_CACHE = `ac-api-${VERSION}`;
const IMG_CACHE = `ac-img-${VERSION}`;
const ALLOWED_CACHES = [SHELL_CACHE, API_CACHE, IMG_CACHE];

// Lo mínimo necesario para arrancar offline.
const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icon.svg",
];

// ---------- 1. INSTALL ----------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .catch(() => {
        /* ignoramos fallos individuales: algunos assets quizá no existan aún en dev */
      })
  );
  // Activar el nuevo SW inmediatamente sin esperar a que cierren pestañas.
  self.skipWaiting();
});

// ---------- 2. ACTIVATE ----------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !ALLOWED_CACHES.includes(k))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// ---------- 3. FETCH (interceptor) ----------
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Solo interceptamos GET; POST/PATCH/DELETE deben ir siempre a la red.
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Ignoramos orígenes externos (salvo imágenes de OSM/unpkg útiles para el mapa).
  const sameOrigin = url.origin === self.location.origin;
  const isMapTile = url.hostname.endsWith("tile.openstreetmap.org");
  if (!sameOrigin && !isMapTile && req.destination !== "image") return;

  // Nunca cachear endpoints de auth sensibles.
  if (url.pathname.startsWith("/api/v1/auth/")) {
    event.respondWith(fetch(req));
    return;
  }

  // API → network-first.
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(req, API_CACHE));
    return;
  }

  // Imágenes (productos, iconos de mapa) → stale-while-revalidate.
  if (req.destination === "image" || isMapTile) {
    event.respondWith(staleWhileRevalidate(req, IMG_CACHE));
    return;
  }

  // Navegación (rutas SPA) → network-first + fallback a index.html.
  if (req.mode === "navigate") {
    event.respondWith(navigationHandler(req));
    return;
  }

  // Resto de assets estáticos (js/css/fuentes) → cache-first.
  event.respondWith(cacheFirst(req, SHELL_CACHE));
});

// ---------- Estrategias ----------

async function cacheFirst(req, cacheName) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(cacheName);
      cache.put(req, res.clone());
    }
    return res;
  } catch (err) {
    return new Response("Recurso no disponible offline", { status: 504 });
  }
}

async function networkFirst(req, cacheName) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(cacheName);
      cache.put(req, res.clone());
    }
    return res;
  } catch (err) {
    const cached = await caches.match(req);
    if (cached) {
      // Añadimos una cabecera para que el cliente sepa que viene de caché.
      const headers = new Headers(cached.headers);
      headers.set("X-From-SW-Cache", "true");
      const body = await cached.clone().text();
      return new Response(body, {
        status: cached.status,
        statusText: cached.statusText,
        headers,
      });
    }
    return new Response(
      JSON.stringify({
        success: false,
        offline: true,
        message: "Sin conexión y sin datos en caché",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const networkPromise = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || networkPromise;
}

async function navigationHandler(req) {
  try {
    return await fetch(req);
  } catch {
    const fallback = await caches.match("/index.html");
    if (fallback) return fallback;
    return new Response(
      "<h1>Sin conexión</h1><p>Vuelve a intentarlo más tarde.</p>",
      { status: 503, headers: { "Content-Type": "text/html" } }
    );
  }
}

// ---------- Mensajes desde la app (p.ej. "refrescar ahora") ----------
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

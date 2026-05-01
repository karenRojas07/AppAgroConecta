/**
 * Service Worker — AgroConecta PWA
 *
 * Estrategias:
 *  - Assets estáticos (HTML, JS, CSS, imágenes): Cache First
 *  - Llamadas API GET: Network First con fallback a Cache
 *  - Llamadas API no-GET: solo red (las mutaciones offline se manejan en la app)
 *  - Background Sync: notifica a los clientes para procesar la syncQueue
 */

const CACHE_NAME = "agroconecta-v1";
const API_PREFIX = "/api/";

// Assets del app shell que se cachean en la instalación
const APP_SHELL = ["/", "/index.html"];

// ─── Install ──────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar extensiones de Chrome, WebSockets y peticiones no-http
  if (!url.protocol.startsWith("http")) return;

  // ── API calls ──
  if (url.pathname.startsWith(API_PREFIX)) {
    // Solo GET se cachea; mutaciones pasan directo a red
    if (request.method !== "GET") return;

    event.respondWith(networkFirstWithCache(request));
    return;
  }

  if (
    request.destination === "image" ||
    url.hostname.includes("tile.openstreetmap.org")
  ) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Resto de assets
  event.respondWith(cacheFirstWithNetwork(request));
});

/**
 * Network First: intenta red, si falla usa caché.
 * Actualiza el caché con la respuesta de red exitosa.
 */
async function networkFirstWithCache(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const networkResponse = await fetch(request);
    // Clonar antes de consumir
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Sin caché: devolver respuesta offline genérica
    return offlineApiResponse();
  }
}

/**
 * Cache First: sirve desde caché si existe, si no busca en red y cachea.
 */
async function cacheFirstWithNetwork(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Para navegación, devolver index.html para que React Router maneje la ruta
    const shell = await cache.match("/index.html");
    if (shell) return shell;
    return new Response("Sin conexión", { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);

  // Devuelve cache inmediato si existe, mientras actualiza en segundo plano
  return cached || networkFetch;
}

function offlineApiResponse() {
  return new Response(
    JSON.stringify({ success: false, message: "Sin conexión. Los datos se sincronizarán cuando vuelva la red." }),
    {
      status: 503,
      headers: { "Content-Type": "application/json" },
    }
  );
}

// ─── Background Sync ──────────────────────────────────────────────────────────

self.addEventListener("sync", (event) => {
  if (event.tag === "agroconecta-sync-queue") {
    event.waitUntil(notificarClientes());
  }
});

async function notificarClientes() {
  const clientes = await self.clients.matchAll({ type: "window" });
  clientes.forEach((client) =>
    client.postMessage({ type: "PROCESS_SYNC_QUEUE" })
  );
}

// ─── Push Notifications (preparado para futuras integraciones) ───────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title ?? "AgroConecta", {
      body: data.body ?? "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-72.png",
      data: data.url ? { url: data.url } : undefined,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientes) => {
        const existing = clientes.find((c) => c.url.includes(url));
        if (existing) return existing.focus();
        return self.clients.openWindow(url);
      })
  );
});

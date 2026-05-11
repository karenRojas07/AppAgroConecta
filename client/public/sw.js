/**
 * Service Worker — AgroConecta PWA
 *
 * Estrategias:
 *  - Assets estáticos (HTML, JS, CSS, imágenes): Cache First
 *  - Llamadas API GET: Network First con fallback a Cache
 *  - Llamadas API no-GET: solo red (las mutaciones offline se manejan en la app)
 *  - Background Sync: notifica a los clientes para procesar la syncQueue
 *
 * En desarrollo (Vite en :5173) este SW se autodesregistra para no
 * interferir con HMR.
 */

const CACHE_NAME = "agroconecta-v3";
const API_PREFIX = "/api/";

// Assets del app shell que se cachean en la instalación
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// ─── Detección de Vite dev server ────────────────────────────────────────────
const IS_VITE_DEV = self.location.port === "5173";

if (IS_VITE_DEV) {
  // En dev: el SW se suicida para no interferir con HMR.
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", (event) => {
    event.waitUntil(autodesregistrar());
  });
} else {
  registerProductionListeners();
}

async function autodesregistrar() {
  const keys = await caches.keys();
  await Promise.all(keys.map((k) => caches.delete(k)));
  await self.registration.unregister();
  const clientes = await self.clients.matchAll({ type: "window" });
  clientes.forEach((c) => c.navigate(c.url));
}

// ─── Listeners de producción ─────────────────────────────────────────────────
function registerProductionListeners() {
  self.addEventListener("install", (event) => {
    event.waitUntil(
      caches
        .open(CACHE_NAME)
        .then((cache) => cache.addAll(APP_SHELL))
        .then(() => self.skipWaiting())
    );
  });

  self.addEventListener("activate", (event) => {
    event.waitUntil(
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
          )
        )
        .then(() => self.clients.claim())
    );
  });

  self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (!url.protocol.startsWith("http")) return;

    if (url.pathname.startsWith(API_PREFIX)) {
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

    event.respondWith(cacheFirstWithNetwork(request));
  });

  self.addEventListener("sync", (event) => {
    if (event.tag === "agroconecta-sync-queue") {
      event.waitUntil(notificarClientes());
    }
  });

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
}

// ─── Helpers de estrategias ──────────────────────────────────────────────────

async function networkFirstWithCache(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const networkResponse = await fetch(request);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return offlineApiResponse();
  }
}

async function cacheFirstWithNetwork(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch {
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
      if (networkResponse.ok) cache.put(request, networkResponse.clone());
      return networkResponse;
    })
    .catch(() => null);

  return cached || networkFetch;
}

function offlineApiResponse() {
  return new Response(
    JSON.stringify({
      success: false,
      message: "Sin conexión. Los datos se sincronizarán cuando vuelva la red.",
    }),
    { status: 503, headers: { "Content-Type": "application/json" } }
  );
}

async function notificarClientes() {
  const clientes = await self.clients.matchAll({ type: "window" });
  clientes.forEach((client) =>
    client.postMessage({ type: "PROCESS_SYNC_QUEUE" })
  );
}

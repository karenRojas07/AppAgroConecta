/*
 * Registro del Service Worker.
 *
 *  - Solo en producción: en dev, Vite usa HMR y el SW puede interferir
 *    con las actualizaciones en caliente.
 *  - Detecta si hay una nueva versión esperando y emite el evento
 *    "sw:update-available" para que la UI muestre un aviso.
 *  - Expone activateWaiting() para aplicar la nueva versión.
 */

export function registerSW() {
  if (!("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD) return;

  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      // Si ya hay un SW esperando al cargar, notificamos.
      if (reg.waiting) emitUpdate(reg);

      // Cuando encuentra una nueva versión.
      reg.addEventListener("updatefound", () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (
            installing.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            emitUpdate(reg);
          }
        });
      });

      // Cuando el SW activo cambia, recargamos para tomar los nuevos assets.
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    } catch (err) {
      console.warn("[SW] no se pudo registrar:", err);
    }
  });
}

function emitUpdate(reg) {
  window.dispatchEvent(
    new CustomEvent("sw:update-available", { detail: { registration: reg } })
  );
}

export function activateWaitingSW(reg) {
  if (reg?.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
}

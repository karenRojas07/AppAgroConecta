import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import "./styles/index.css";
import { iniciarSyncManager } from "./utils/syncManager.js";

// ── Registro del Service Worker ──────────────────────────────────────────────
// Solo en producción: en dev (Vite) el SW interfiere con HMR y provoca
// recargas automáticas porque Vite versiona los imports y el SW responde con
// versiones cacheadas. Por eso aquí desregistramos cualquier SW previo en dev.
if ("serviceWorker" in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.info("[PWA] Service Worker registrado:", reg.scope);
          if ("sync" in reg) {
            navigator.serviceWorker.ready.then((r) =>
              r.sync.register("agroconecta-sync-queue").catch(() => {})
            );
          }
        })
        .catch((err) => console.warn("[PWA] Error al registrar SW:", err));
    });
  } else {
    // Dev: limpiar SWs y cachés viejos para que HMR funcione bien.
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
    if ("caches" in window) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
    }
    console.info("[PWA] SW deshabilitado en desarrollo (Vite HMR).");
  }
}

// ── Iniciar manager de sincronización offline ────────────────────────────────
iniciarSyncManager();

ReactDOM.createRoot(document.getElementById("root")).render(
  // StrictMode quitado: en dev hacía que cada useEffect (y cada fetch) se
  // disparara dos veces, saturando los 6 slots de conexión del navegador.
  <BrowserRouter>
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  </BrowserRouter>
);

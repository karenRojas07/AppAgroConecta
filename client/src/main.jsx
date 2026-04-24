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
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.info("[PWA] Service Worker registrado:", reg.scope);
        // Solicitar Background Sync cuando haya conexión
        if ("sync" in reg) {
          navigator.serviceWorker.ready.then((r) =>
            r.sync.register("agroconecta-sync-queue").catch(() => {})
          );
        }
      })
      .catch((err) => console.warn("[PWA] Error al registrar SW:", err));
  });
}

// ── Iniciar manager de sincronización offline ────────────────────────────────
iniciarSyncManager();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);

import { NavLink, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { network } from "../utils/perifericos.js";

export default function Navbar() {
  const { user, isAuth, isProductor, isConsumidor, logout } = useAuth();
  const { count } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // ─── Instalación PWA (beforeinstallprompt) ──────────────────────────────
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    // Si ya está instalada como standalone
    if (window.matchMedia?.("(display-mode: standalone)").matches) {
      setInstalled(true);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") toast.success("Instalando AgroConecta…");
    setInstallPrompt(null);
  };

  // ─── Estado de red (Network Information API) ────────────────────────────
  const [redInfo, setRedInfo] = useState(network.getEstado());
  useEffect(() => network.suscribir(setRedInfo), []);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      toast.info("Sesión cerrada");
      navigate("/");
    } finally {
      setLoggingOut(false);
    }
  };

  const close = () => setOpen(false);

  return (
    <header className="navbar">
      <div className="nav-inner">
        <Link to="/" className="brand" onClick={close}>
          <span className="brand-dot">◆</span> AgroConecta
        </Link>

        <button
          className="nav-burger"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menú"
        >
          <span /><span /><span />
        </button>

        <nav className={`nav-links ${open ? "open" : ""}`}>
          <NavLink to="/productos" onClick={close}>Productos</NavLink>
          <NavLink to="/productores" onClick={close}>Productores</NavLink>
          <NavLink to="/mapa" onClick={close}>Mapa</NavLink>
          <NavLink to="/dispositivo" onClick={close}>Dispositivo</NavLink>
          {isAuth && <NavLink to="/pedidos" onClick={close}>Pedidos</NavLink>}
          {isAuth && <NavLink to="/resenas" onClick={close}>Reseñas</NavLink>}
          {isProductor && <NavLink to="/dashboard" onClick={close}>Panel</NavLink>}

          {isConsumidor && (
            <NavLink to="/carrito" className="nav-cart" onClick={close}>
              <span>Carrito</span>
              {count > 0 && <span className="cart-badge">{count}</span>}
            </NavLink>
          )}

          <span
            className={`net-chip ${redInfo.online ? "online" : "offline"}`}
            title={
              redInfo.online
                ? `Conectado · ${redInfo.effectiveType ?? "sin info"}`
                : "Sin conexión — modo offline"
            }
          >
            <span className="net-dot" />
            {redInfo.online ? (redInfo.effectiveType?.toUpperCase() || "ON") : "OFFLINE"}
          </span>

          {installPrompt && !installed && (
            <button className="btn btn-primary btn-sm" onClick={handleInstall}>
              ⬇ Instalar
            </button>
          )}

          {isAuth ? (
            <div className="nav-user">
              <NavLink to="/perfil" className="nav-user-chip" onClick={close}>
                <span className="user-avatar">
                  {user?.nombre?.[0]?.toUpperCase() || "?"}
                </span>
                <div className="user-info">
                  <span className="user-name">{user?.nombre}</span>
                  <span className="user-role">{user?.rol}</span>
                </div>
              </NavLink>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? "Saliendo…" : "Salir"}
              </button>
            </div>
          ) : (
            <div className="nav-auth">
              <NavLink to="/login" className="btn btn-ghost btn-sm" onClick={close}>
                Login
              </NavLink>
              <NavLink to="/registro" className="btn btn-primary btn-sm" onClick={close}>
                Registrarse
              </NavLink>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

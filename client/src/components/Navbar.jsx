import { NavLink, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function Navbar() {
  const { user, isAuth, isProductor, isConsumidor, logout } = useAuth();
  const { count } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.info("Sesión cerrada");
    navigate("/");
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
          {isAuth && <NavLink to="/pedidos" onClick={close}>Pedidos</NavLink>}
          {isAuth && <NavLink to="/resenas" onClick={close}>Reseñas</NavLink>}
          {isProductor && <NavLink to="/dashboard" onClick={close}>Panel</NavLink>}

          {isConsumidor && (
            <NavLink to="/carrito" className="nav-cart" onClick={close}>
              <span>Carrito</span>
              {count > 0 && <span className="cart-badge">{count}</span>}
            </NavLink>
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
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Salir
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

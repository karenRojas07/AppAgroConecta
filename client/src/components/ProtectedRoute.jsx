
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children, rol }) {
  const { isAuth, user, loading, authError } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container"><div className="card empty-state"><h2>Cargando...</h2></div></div>
    );
  }
  if (authError) {
    return (
      <div className="container"><div className="card empty-state"><h2>Error de autenticación</h2><p>{authError}</p></div></div>
    );
  }
  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (rol && user?.rol !== rol) {
    return (
      <div className="container">
        <div className="card empty-state">
          <h2>Acceso restringido</h2>
          <p>Esta sección es solo para usuarios con rol <b>{rol}</b>.</p>
        </div>
      </div>
    );
  }
  return children;
}

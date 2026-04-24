import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container">
      <div className="empty-state card" style={{ marginTop: "4rem" }}>
        <h1 style={{ fontSize: "4rem", margin: 0 }}>404</h1>
        <h3>Página no encontrada</h3>
        <p>La ruta que buscas no existe o fue removida.</p>
        <Link to="/" className="btn btn-primary">Volver al inicio</Link>
      </div>
    </div>
  );
}

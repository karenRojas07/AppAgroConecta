import { Link } from "react-router-dom";
import { formatCOP } from "../utils/format.js";

export default function ProductCard({ producto, onAdd, showActions = true }) {
  const agotado = producto.cantidadDisponible <= 0;
  return (
    <article className="prod-card">
      <Link to={`/productos/${producto.idProducto}`} className="prod-media">
        {producto.foto ? (
          <img src={producto.foto} alt={producto.nombre} loading="lazy" />
        ) : (
          <div className="prod-placeholder">
            <span>{producto.nombre?.[0] ?? "?"}</span>
          </div>
        )}
        {agotado && <span className="prod-badge">Agotado</span>}
      </Link>
      <div className="prod-body">
        <Link to={`/productos/${producto.idProducto}`} className="prod-title">
          {producto.nombre}
        </Link>
        <p className="prod-desc">{producto.descripcion}</p>
        <div className="prod-foot">
          <div>
            <div className="prod-price">{formatCOP(producto.precio)}</div>
            <div className="prod-stock">
              {agotado ? "Sin existencias" : `${producto.cantidadDisponible} disponibles`}
            </div>
          </div>
          {showActions && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onAdd?.(producto)}
              disabled={agotado}
            >
              Añadir
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

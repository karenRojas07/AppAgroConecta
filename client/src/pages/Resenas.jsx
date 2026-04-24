import { useEffect, useState } from "react";
import { api } from "../api/client";
import Loading from "../components/Loading.jsx";
import StarRating from "../components/StarRating.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { formatDate } from "../utils/format.js";

export default function Resenas() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.listResenas();
        setItems(data || []);
      } catch (e) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <span className="kicker">Comunidad</span>
          <h1>Reseñas</h1>
          <p className="muted">Opiniones verificadas de pedidos entregados.</p>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <div className="empty-state card">
          <h3>Sin reseñas todavía</h3>
          <p>Cuando tus pedidos sean entregados, podrás dejar tu opinión.</p>
        </div>
      ) : (
        <div className="resenas-list">
          {items.map((r) => (
            <div key={r.idResena} className="card resena-item">
              <div className="resena-head">
                <StarRating value={r.calificacion} readOnly />
                <span className="muted">
                  Pedido #{r.idPedido} · Productor #{r.idProductor}
                </span>
              </div>
              <p>{r.comentario}</p>
              <small className="muted">{formatDate(r.createdAt)}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

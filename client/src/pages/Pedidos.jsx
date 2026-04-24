import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import Loading from "../components/Loading.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { estadoLabel, estadoColor, formatCOP, formatDate } from "../utils/format.js";

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("TODOS");
  const toast = useToast();
  const { isProductor } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.listPedidos();
        setPedidos(data || []);
      } catch (e) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line
  }, []);

  const filtered = filter === "TODOS" ? pedidos : pedidos.filter((p) => p.estado === filter);
  const estados = ["TODOS", "PENDIENTE", "CONFIRMADO", "EN_PREPARACION", "LISTO", "ENTREGADO", "CANCELADO"];

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <span className="kicker">Historial</span>
          <h1>{isProductor ? "Pedidos recibidos" : "Tus pedidos"}</h1>
          <p className="muted">
            {isProductor
              ? "Gestiona los estados de los pedidos de tus clientes."
              : "Consulta el estado de todos tus pedidos."}
          </p>
        </div>
      </div>

      <div className="chip-bar">
        {estados.map((e) => (
          <button
            key={e}
            className={`chip-btn ${filter === e ? "active" : ""}`}
            onClick={() => setFilter(e)}
          >
            {e === "TODOS" ? "Todos" : estadoLabel[e]}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <div className="empty-state card">
          <h3>Sin pedidos</h3>
          <p>{filter === "TODOS" ? "Aún no hay pedidos." : "Ningún pedido en este estado."}</p>
        </div>
      ) : (
        <div className="pedidos-list">
          {filtered.map((p) => (
            <Link key={p.idPedido} to={`/pedidos/${p.idPedido}`} className="pedido-row card">
              <div>
                <div className="pedido-id">#{p.idPedido}</div>
                <div className="muted">{formatDate(p.createdAt)}</div>
              </div>
              <div>
                <div className="muted">Entrega</div>
                <b>{p.tipoEntrega === "DOMICILIO" ? "Domicilio" : "Recogida finca"}</b>
              </div>
              <div>
                <div className="muted">Items</div>
                <b>{p.detalles?.length || 0}</b>
              </div>
              <div>
                <div className="muted">Total</div>
                <b>{formatCOP(p.total)}</b>
              </div>
              <span className={`status-chip ${estadoColor[p.estado]}`}>
                {estadoLabel[p.estado]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

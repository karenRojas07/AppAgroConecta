import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import Loading from "../components/Loading.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function Productores() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const toast = useToast();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.listProductores();
        setItems(data || []);
      } catch (e) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line
  }, []);

  const filtered = items.filter((p) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      p.nombreFinca?.toLowerCase().includes(s) ||
      p.usuario?.nombre?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <span className="kicker">Red rural</span>
          <h1>Productores</h1>
          <p className="muted">Conoce las fincas detrás de cada producto.</p>
        </div>
      </div>

      <input
        className="search card"
        type="search"
        placeholder="Buscar productor o finca..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ marginBottom: "1.5rem" }}
      />

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <div className="empty-state card">
          <h3>No hay productores</h3>
        </div>
      ) : (
        <div className="grid-cards">
          {filtered.map((p) => (
            <Link
              key={p.idUsuario}
              to={`/productores/${p.idUsuario}`}
              className="prod-card productor-card"
            >
              <div className="productor-avatar">
                {p.usuario?.nombre?.[0]?.toUpperCase() || "P"}
              </div>
              <div className="prod-body">
                <div className="prod-title">{p.usuario?.nombre}</div>
                <p className="muted"><b>{p.nombreFinca}</b></p>
                <p className="prod-desc">🕓 {p.horarioRecogida}</p>
                {p.usuario?.telefono && (
                  <p className="muted">📞 {p.usuario.telefono}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

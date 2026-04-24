import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import Loading from "../components/Loading.jsx";
import ProductCard from "../components/ProductCard.jsx";
import StarRating from "../components/StarRating.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { formatDate } from "../utils/format.js";

export default function ProductorDetail() {
  const { id } = useParams();
  const [productor, setProductor] = useState(null);
  const [productos, setProductos] = useState([]);
  const [resenas, setResenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuth, isConsumidor } = useAuth();
  const { addItem } = useCart();
  const toast = useToast();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.getProductor(id);
        setProductor(data);
        const { data: prods } = await api.listProductos({ idProductor: id });
        setProductos(prods || []);
        if (isAuth) {
          try {
            const { data: res } = await api.listResenas({ idProductor: id });
            setResenas(res || []);
          } catch {
            // ignore
          }
        }
      } catch (e) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line
  }, [id]);

  const handleAdd = (p) => {
    if (!isConsumidor) {
      toast.info("Inicia sesión como consumidor para comprar");
      return;
    }
    addItem(p, 1);
    toast.success(`${p.nombre} añadido al carrito`);
  };

  if (loading) return <Loading />;
  if (!productor) return null;

  const promedio =
    resenas.length > 0
      ? (
          resenas.reduce((a, r) => a + Number(r.calificacion), 0) / resenas.length
        ).toFixed(1)
      : null;

  return (
    <div className="container">
      <Link to="/productores" className="back-link">← Volver a productores</Link>

      <div className="productor-hero card">
        <div className="productor-avatar big">
          {productor.usuario?.nombre?.[0]?.toUpperCase() || "P"}
        </div>
        <div>
          <h1>{productor.usuario?.nombre}</h1>
          <p className="productor-sub">{productor.nombreFinca}</p>
          <div className="productor-meta">
            <span>🕓 {productor.horarioRecogida}</span>
            {productor.usuario?.telefono && <span>📞 {productor.usuario.telefono}</span>}
            {productor.usuario?.correo && <span>✉ {productor.usuario.correo}</span>}
          </div>
          {promedio && (
            <div className="productor-rate">
              <StarRating value={Math.round(promedio)} readOnly />
              <b>{promedio}</b> · {resenas.length} reseña{resenas.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      <div className="section-head">
        <h2>Productos de esta finca</h2>
      </div>
      {productos.length === 0 ? (
        <div className="empty-state card">
          <p>Este productor aún no tiene productos publicados.</p>
        </div>
      ) : (
        <div className="grid-cards">
          {productos.map((p) => (
            <ProductCard key={p.idProducto} producto={p} onAdd={handleAdd} />
          ))}
        </div>
      )}

      {isAuth && resenas.length > 0 && (
        <>
          <div className="section-head">
            <h2>Reseñas</h2>
          </div>
          <div className="resenas-list">
            {resenas.map((r) => (
              <div key={r.idResena} className="card resena-item">
                <StarRating value={r.calificacion} readOnly />
                <p>{r.comentario}</p>
                <small className="muted">{formatDate(r.createdAt)}</small>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

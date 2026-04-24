import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import Loading from "../components/Loading.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { formatCOP } from "../utils/format.js";

export default function ProductoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isConsumidor, isProductor } = useAuth();
  const { addItem } = useCart();
  const toast = useToast();

  const [producto, setProducto] = useState(null);
  const [productor, setProductor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  const isOwner = isProductor && producto && user?.idUsuario === producto.idProductor;

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.getProducto(id);
      setProducto(data);
      if (data?.idProductor) {
        try {
          const { data: pr } = await api.getProductor(data.idProductor);
          setProductor(pr);
        } catch {
          setProductor(null);
        }
      }
    } catch (e) {
      toast.error(e.message);
      navigate("/productos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [id]);

  const handleAdd = () => {
    if (!isConsumidor) {
      toast.info("Inicia sesión como consumidor para comprar");
      return;
    }
    addItem(producto, qty);
    toast.success(`${producto.nombre} añadido al carrito`);
  };

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este producto?")) return;
    try {
      await api.deleteProducto(producto.idProducto);
      toast.success("Producto eliminado");
      navigate("/dashboard");
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (loading) return <Loading />;
  if (!producto) return null;

  const agotado = producto.cantidadDisponible <= 0;

  return (
    <div className="container">
      <Link to="/productos" className="back-link">← Volver al catálogo</Link>

      <div className="detail-grid">
        <div className="detail-media card">
          {producto.foto ? (
            <img src={producto.foto} alt={producto.nombre} />
          ) : (
            <div className="prod-placeholder big">
              <span>{producto.nombre?.[0] ?? "?"}</span>
            </div>
          )}
        </div>

        <div className="detail-info card">
          <h1>{producto.nombre}</h1>
          <p className="detail-price">{formatCOP(producto.precio)}</p>
          <p className="detail-stock">
            {agotado ? (
              <span className="chip danger">Agotado</span>
            ) : (
              <span className="chip ok">{producto.cantidadDisponible} disponibles</span>
            )}
          </p>
          <p className="detail-desc">{producto.descripcion}</p>

          {productor && (
            <div className="productor-ref">
              <span className="muted">Publicado por</span>
              <Link to={`/productores/${productor.idUsuario}`}>
                <b>{productor.usuario?.nombre || productor.nombreFinca}</b> · {productor.nombreFinca}
              </Link>
            </div>
          )}

          {isOwner ? (
            <div className="action-row">
              <Link to="/dashboard" className="btn btn-primary">Gestionar desde panel</Link>
              <button className="btn btn-danger" onClick={handleDelete}>Eliminar</button>
            </div>
          ) : (
            <div className="qty-row">
              <div className="qty-input">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >−</button>
                <input
                  type="number"
                  min={1}
                  max={producto.cantidadDisponible || 1}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value) || 1)}
                />
                <button
                  type="button"
                  onClick={() =>
                    setQty((q) => Math.min(producto.cantidadDisponible || 1, q + 1))
                  }
                >+</button>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleAdd}
                disabled={agotado}
              >
                {agotado ? "Sin stock" : "Añadir al carrito"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { api } from "../api/client";
import { formatCOP } from "../utils/format.js";

export default function Carrito() {
  const { items, updateQty, removeItem, clear, total } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [tipoEntrega, setTipoEntrega] = useState("RECOGIDA_FINCA");
  const [costoEnvio, setCostoEnvio] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const envio = tipoEntrega === "DOMICILIO" ? Number(costoEnvio) || 0 : 0;
  const totalFinal = useMemo(() => total + envio, [total, envio]);

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error("Tu carrito está vacío");
      return;
    }
    setSubmitting(true);
    try {
      const detalles = items.map((i) => ({
        idProducto: i.idProducto,
        cantidad: i.cantidad,
      }));
      const { data } = await api.createPedido({
        tipoEntrega,
        costoEnvio: envio,
        detalles,
      });
      clear();
      toast.success("Pedido creado con éxito");
      navigate(`/pedidos/${data.idPedido}`);
    } catch (e) {
      toast.error(e.message || "No se pudo crear el pedido");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <span className="kicker">Tu carrito</span>
          <h1>Confirma tu pedido</h1>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state card">
          <h3>Tu carrito está vacío</h3>
          <p>Agrega productos del catálogo para continuar.</p>
          <Link to="/productos" className="btn btn-primary">Ver productos</Link>
        </div>
      ) : (
        <div className="cart-grid">
          <div className="cart-items">
            {items.map((i) => (
              <div key={i.idProducto} className="cart-row card">
                <div className="cart-media">
                  {i.foto ? (
                    <img src={i.foto} alt={i.nombre} />
                  ) : (
                    <div className="prod-placeholder sm">
                      <span>{i.nombre[0]}</span>
                    </div>
                  )}
                </div>
                <div className="cart-info">
                  <Link to={`/productos/${i.idProducto}`} className="cart-title">
                    {i.nombre}
                  </Link>
                  <div className="muted">{formatCOP(i.precio)} c/u</div>
                </div>
                <div className="qty-input">
                  <button type="button" onClick={() => updateQty(i.idProducto, i.cantidad - 1)}>−</button>
                  <input
                    type="number"
                    min={1}
                    value={i.cantidad}
                    onChange={(e) => updateQty(i.idProducto, Number(e.target.value) || 1)}
                  />
                  <button type="button" onClick={() => updateQty(i.idProducto, i.cantidad + 1)}>+</button>
                </div>
                <div className="cart-sub">{formatCOP(i.precio * i.cantidad)}</div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => removeItem(i.idProducto)}
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>

          <aside className="cart-summary card">
            <h3>Resumen</h3>

            <label className="field">
              <span>Tipo de entrega</span>
              <select
                value={tipoEntrega}
                onChange={(e) => setTipoEntrega(e.target.value)}
              >
                <option value="RECOGIDA_FINCA">Recogida en finca</option>
                <option value="DOMICILIO">Domicilio</option>
              </select>
            </label>

            {tipoEntrega === "DOMICILIO" && (
              <label className="field">
                <span>Costo de envío</span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={costoEnvio}
                  onChange={(e) => setCostoEnvio(e.target.value)}
                />
              </label>
            )}

            <div className="sum-row"><span>Subtotal</span><b>{formatCOP(total)}</b></div>
            <div className="sum-row"><span>Envío</span><b>{formatCOP(envio)}</b></div>
            <div className="sum-row total"><span>Total</span><b>{formatCOP(totalFinal)}</b></div>

            <button
              className="btn btn-primary btn-block"
              onClick={handleCheckout}
              disabled={submitting}
            >
              {submitting ? "Procesando..." : "Crear pedido"}
            </button>
            <button className="btn btn-ghost btn-block" onClick={clear}>
              Vaciar carrito
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}

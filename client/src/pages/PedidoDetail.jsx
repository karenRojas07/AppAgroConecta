import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import Loading from "../components/Loading.jsx";
import StarRating from "../components/StarRating.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { estadoColor, estadoLabel, formatCOP, formatDate } from "../utils/format.js";

const ESTADOS = ["PENDIENTE", "CONFIRMADO", "EN_PREPARACION", "LISTO", "ENTREGADO", "CANCELADO"];

export default function PedidoDetail() {
  const { id } = useParams();
  const { isProductor, isConsumidor } = useAuth();
  const toast = useToast();

  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newState, setNewState] = useState("");

  // Reseña
  const [resenaExistente, setResenaExistente] = useState(null);
  const [calificacion, setCalificacion] = useState(5);
  const [comentario, setComentario] = useState("");
  const [sendingResena, setSendingResena] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.getPedido(id);
      setPedido(data);
      setNewState(data.estado);

      // resena asociada
      try {
        const all = await api.listResenas();
        const found = (all.data || []).find((r) => r.idPedido === data.idPedido);
        setResenaExistente(found || null);
      } catch {
        // ignore
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [id]);

  const handleUpdateEstado = async () => {
    if (!newState || newState === pedido.estado) return;
    setUpdating(true);
    try {
      await api.cambiarEstadoPedido(pedido.idPedido, newState);
      toast.success("Estado actualizado");
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleResena = async (e) => {
    e.preventDefault();
    if (!pedido) return;
    // El pedido no trae idProductor directo: lo derivamos del primer producto
    let prodId = null;
    try {
      if (pedido.detalles?.length) {
        const { data: prod } = await api.getProducto(pedido.detalles[0].idProducto);
        prodId = prod.idProductor;
      }
    } catch {
      // ignore
    }
    if (!prodId) {
      toast.error("No se pudo determinar el productor del pedido");
      return;
    }
    setSendingResena(true);
    try {
      await api.createResena({
        idPedido: pedido.idPedido,
        idProductor: prodId,
        calificacion,
        comentario,
      });
      toast.success("Reseña publicada");
      setComentario("");
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSendingResena(false);
    }
  };

  if (loading) return <Loading />;
  if (!pedido) return null;

  const puedeResenar =
    isConsumidor && pedido.estado === "ENTREGADO" && !resenaExistente;

  return (
    <div className="container">
      <Link to="/pedidos" className="back-link">← Volver a pedidos</Link>

      <div className="page-head">
        <div>
          <span className="kicker">Pedido #{pedido.idPedido}</span>
          <h1>Detalle del pedido</h1>
          <p className="muted">Creado el {formatDate(pedido.createdAt)}</p>
        </div>
        <span className={`status-chip big ${estadoColor[pedido.estado]}`}>
          {estadoLabel[pedido.estado]}
        </span>
      </div>

      <div className="detail-grid">
        <div className="card">
          <h3>Productos</h3>
          <table className="tbl">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Precio</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {pedido.detalles?.map((d) => (
                <tr key={d.idDetallePedido || d.idProducto}>
                  <td>
                    <Link to={`/productos/${d.idProducto}`}>#{d.idProducto}</Link>
                  </td>
                  <td>{d.cantidad}</td>
                  <td>{formatCOP(d.precioUnitario)}</td>
                  <td><b>{formatCOP(d.subtotal)}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="card">
          <h3>Resumen</h3>
          <div className="sum-row">
            <span>Tipo entrega</span>
            <b>{pedido.tipoEntrega === "DOMICILIO" ? "Domicilio" : "Recogida finca"}</b>
          </div>
          <div className="sum-row">
            <span>Costo envío</span>
            <b>{formatCOP(pedido.costoEnvio)}</b>
          </div>
          <div className="sum-row total">
            <span>Total</span>
            <b>{formatCOP(pedido.total)}</b>
          </div>

          {isProductor && (
            <>
              <hr />
              <h4>Cambiar estado</h4>
              <select
                value={newState}
                onChange={(e) => setNewState(e.target.value)}
              >
                {ESTADOS.map((s) => (
                  <option key={s} value={s}>
                    {estadoLabel[s]}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-primary btn-block"
                onClick={handleUpdateEstado}
                disabled={updating || newState === pedido.estado}
              >
                {updating ? "Guardando..." : "Actualizar estado"}
              </button>
            </>
          )}
        </aside>
      </div>

      {isConsumidor && (
        <div className="card resena-box">
          <h3>Reseña</h3>
          {resenaExistente ? (
            <div className="resena-existente">
              <StarRating value={resenaExistente.calificacion} readOnly />
              <p>{resenaExistente.comentario}</p>
              <small className="muted">Publicada el {formatDate(resenaExistente.createdAt)}</small>
            </div>
          ) : puedeResenar ? (
            <form onSubmit={handleResena}>
              <label className="field">
                <span>Calificación</span>
                <StarRating value={calificacion} onChange={setCalificacion} size={28} />
              </label>
              <label className="field">
                <span>Comentario</span>
                <textarea
                  rows={4}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  minLength={2}
                  maxLength={1500}
                  required
                  placeholder="Cuéntanos tu experiencia..."
                />
              </label>
              <button className="btn btn-primary" disabled={sendingResena}>
                {sendingResena ? "Enviando..." : "Publicar reseña"}
              </button>
            </form>
          ) : (
            <p className="muted">
              Podrás reseñar cuando el pedido esté en estado <b>ENTREGADO</b>.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

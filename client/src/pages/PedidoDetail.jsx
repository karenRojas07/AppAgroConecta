import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import Loading from "../components/Loading.jsx";
import StarRating from "../components/StarRating.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { estadoColor, estadoLabel, formatCOP, formatDate } from "../utils/format.js";
import { camera, qr } from "../utils/perifericos.js";

const ESTADOS = ["PENDIENTE", "CONFIRMADO", "EN_PREPARACION", "LISTO", "ENTREGADO", "CANCELADO"];

// Formato del QR que comparte consumidor → productor para confirmar entrega
const QR_PREFIX = "agroconecta:pedido:";
const buildQRPayload = (id) => `${QR_PREFIX}${id}`;
const qrImageUrl = (id) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(buildQRPayload(id))}`;

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

  // Escaneo QR (lado productor)
  const videoRef = useRef(null);
  const [scanStream, setScanStream] = useState(null);
  const [scanning, setScanning] = useState(false);
  const scanningRef = useRef(false);

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

  const handleUpdateEstado = async (estadoOverride) => {
    const target = estadoOverride || newState;
    if (!target || target === pedido.estado) return;
    setUpdating(true);
    try {
      await api.cambiarEstadoPedido(pedido.idPedido, target);
      toast.success("Estado actualizado");
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setUpdating(false);
    }
  };

  // ─── Escaneo de QR para confirmar entrega ─────────────────────────────────
  const iniciarEscaneo = async () => {
    if (!qr.isSupported()) {
      toast.error("Tu navegador no soporta BarcodeDetector. Prueba en Chrome/Edge Android o macOS.");
      return;
    }
    try {
      const s = await camera.open("environment");
      setScanStream(s);
      setScanning(true);
      scanningRef.current = true;
      requestAnimationFrame(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play();
          loopEscaneo();
        }
      });
    } catch (e) {
      toast.error(e.message);
    }
  };

  const detenerEscaneo = () => {
    scanningRef.current = false;
    setScanning(false);
    camera.stop(scanStream);
    setScanStream(null);
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const loopEscaneo = async () => {
    if (!scanningRef.current || !videoRef.current) return;
    try {
      const texto = await qr.detect(videoRef.current);
      if (texto) {
        if (texto !== buildQRPayload(pedido.idPedido)) {
          toast.error(`El QR no corresponde a este pedido (${texto}).`);
          detenerEscaneo();
          return;
        }
        detenerEscaneo();
        toast.success("QR verificado. Confirmando entrega…");
        await handleUpdateEstado("ENTREGADO");
        return;
      }
    } catch {
      // ignorar fallos puntuales del detector
    }
    setTimeout(loopEscaneo, 300);
  };

  useEffect(() => () => {
    scanningRef.current = false;
    camera.stop(scanStream);
  }, [scanStream]);

  const handleResena = async (e) => {
    e.preventDefault();
    if (!pedido) return;
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

  // El QR de entrega solo tiene sentido hasta antes de "ENTREGADO"
  const mostrarQREntrega =
    pedido.estado !== "ENTREGADO" && pedido.estado !== "CANCELADO";

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
                onClick={() => handleUpdateEstado()}
                disabled={updating || newState === pedido.estado}
              >
                {updating ? "Guardando..." : "Actualizar estado"}
              </button>
            </>
          )}
        </aside>
      </div>

      {/* ── QR de entrega ────────────────────────────────────── */}
      {mostrarQREntrega && (isConsumidor || isProductor) && (
        <div className="card qr-entrega">
          {isConsumidor && (
            <>
              <h3>📱 Tu código de entrega</h3>
              <p className="muted">
                Muéstrale este QR al productor cuando te entregue el pedido para
                que pueda confirmarlo desde su panel.
              </p>
              <div className="qr-img-wrap">
                <img
                  src={qrImageUrl(pedido.idPedido)}
                  alt={`QR del pedido ${pedido.idPedido}`}
                  width={220}
                  height={220}
                />
              </div>
              <code className="qr-payload">{buildQRPayload(pedido.idPedido)}</code>
            </>
          )}

          {isProductor && (
            <>
              <h3>📷 Confirmar entrega por QR</h3>
              <p className="muted">
                Escanea el QR que muestra el cliente para marcar el pedido como
                <b> ENTREGADO</b>.
              </p>
              {!scanning ? (
                <button className="btn btn-primary" onClick={iniciarEscaneo}>
                  Escanear QR del cliente
                </button>
              ) : (
                <>
                  <div className="device-video-wrap inline">
                    <video ref={videoRef} playsInline muted className="device-video" />
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={detenerEscaneo}>
                    Cancelar escaneo
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}

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

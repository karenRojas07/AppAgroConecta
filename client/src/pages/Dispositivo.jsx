import { useEffect, useRef, useState } from "react";
import { useToast } from "../context/ToastContext.jsx";
import { camera, bluetooth, network } from "../utils/perifericos.js";

/**
 * Página de diagnóstico del dispositivo.
 *
 * Aquí solo viven los periféricos que no tienen una pantalla "natural" en la
 * app: estado de red, prueba de cámara y emparejamiento Bluetooth.
 *
 * - El QR vive en /pedidos/:id (confirmación de entrega).
 * - El sensor de orientación vive en /mapa (brújula).
 * - La foto del producto se toma desde /dashboard.
 */
export default function Dispositivo() {
  const toast = useToast();

  // ─── Cámara (prueba de hardware) ───────────────────────────────────────────
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [snapshot, setSnapshot] = useState(null);

  const abrirCamara = async () => {
    try {
      const s = await camera.open("environment");
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  const cerrarCamara = () => {
    camera.stop(stream);
    setStream(null);
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const tomarFoto = async () => {
    if (!videoRef.current) return;
    try {
      const blob = await camera.snapshot(videoRef.current);
      setSnapshot({
        url: URL.createObjectURL(blob),
        sizeKb: Math.round(blob.size / 1024),
        type: blob.type,
      });
    } catch (e) {
      toast.error(e.message);
    }
  };

  useEffect(() => () => camera.stop(stream), [stream]);

  // ─── Bluetooth ─────────────────────────────────────────────────────────────
  const [bleDevice, setBleDevice] = useState(null);
  const [bleBateria, setBleBateria] = useState(null);

  const conectarBT = async () => {
    try {
      const device = await bluetooth.pedirDispositivo();
      setBleDevice({ id: device.id, name: device.name || "(sin nombre)" });
      const bateria = await bluetooth.leerBateria(device);
      setBleBateria(bateria);
      toast.success(`Emparejado con ${device.name || "dispositivo"}`);
    } catch (e) {
      toast.error(e.message);
    }
  };

  // ─── Network Information ───────────────────────────────────────────────────
  const [redInfo, setRedInfo] = useState(network.getEstado());
  useEffect(() => network.suscribir(setRedInfo), []);

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <span className="kicker">Diagnóstico</span>
          <h1>Estado del dispositivo</h1>
          <p className="muted">
            Información de red, prueba de cámara y emparejamiento Bluetooth.
            Los demás periféricos (QR, sensores) viven en sus pantallas naturales.
          </p>
        </div>
      </div>

      <div className="device-grid">
        {/* ── Network Information ─────────────────────────────── */}
        <section className="card device-card">
          <h3>📡 Estado de red</h3>
          <p className="muted">
            Información en vivo de <code>navigator.connection</code>.
          </p>
          <ul className="device-info">
            <li><b>Online:</b> {redInfo.online ? "sí" : "no"}</li>
            <li><b>Tipo efectivo:</b> {redInfo.effectiveType ?? "no soportado"}</li>
            <li><b>Downlink:</b> {redInfo.downlink ? `${redInfo.downlink} Mbps` : "—"}</li>
            <li><b>RTT:</b> {redInfo.rtt != null ? `${redInfo.rtt} ms` : "—"}</li>
            <li><b>Ahorro de datos:</b> {redInfo.saveData ? "activo" : "no"}</li>
          </ul>
          {!redInfo.soportado && (
            <p className="device-warn">
              Network Information API no soportada en este navegador.
            </p>
          )}
        </section>

        {/* ── Cámara (test) ───────────────────────────────────── */}
        <section className="card device-card">
          <h3>📷 Prueba de cámara</h3>
          <p className="muted">
            Verifica que la cámara funcione. Para tomar la foto real de un
            producto, ve a <b>Panel → Nuevo producto</b>.
          </p>
          <div className="device-video-wrap">
            <video ref={videoRef} playsInline muted className="device-video" />
          </div>
          <div className="device-actions">
            {!stream ? (
              <button className="btn btn-primary btn-sm" onClick={abrirCamara}>
                Abrir cámara
              </button>
            ) : (
              <>
                <button className="btn btn-primary btn-sm" onClick={tomarFoto}>
                  Tomar foto de prueba
                </button>
                <button className="btn btn-ghost btn-sm" onClick={cerrarCamara}>
                  Cerrar
                </button>
              </>
            )}
          </div>
          {snapshot && (
            <div className="device-snapshot">
              <img src={snapshot.url} alt="captura" />
              <p className="muted">
                {snapshot.type} · {snapshot.sizeKb} KB
              </p>
            </div>
          )}
        </section>

        {/* ── Bluetooth ───────────────────────────────────────── */}
        <section className="card device-card">
          <h3>📶 Bluetooth</h3>
          <p className="muted">
            Empareja un dispositivo BLE con <code>navigator.bluetooth</code>.
          </p>
          <button
            className="btn btn-primary btn-sm"
            onClick={conectarBT}
            disabled={!bluetooth.isSupported()}
          >
            Buscar dispositivo
          </button>
          {bleDevice && (
            <ul className="device-info">
              <li><b>Nombre:</b> {bleDevice.name}</li>
              <li><b>ID:</b> <code>{bleDevice.id}</code></li>
              <li>
                <b>Batería:</b>{" "}
                {bleBateria != null ? `${bleBateria}%` : "no expuesta"}
              </li>
            </ul>
          )}
          {!bluetooth.isSupported() && (
            <p className="device-warn">
              Web Bluetooth requiere Chrome/Edge en HTTPS (o localhost).
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

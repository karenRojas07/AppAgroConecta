import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import Loading from "../components/Loading.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { sensores } from "../utils/perifericos.js";

const iconProductor = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`<svg xmlns='http://www.w3.org/2000/svg' width='36' height='48' viewBox='0 0 36 48'>
<path d='M18 0C8 0 0 8 0 18c0 13 18 30 18 30s18-17 18-30C36 8 28 0 18 0z' fill='#1f7a4d'/>
<circle cx='18' cy='18' r='7' fill='#fff'/>
</svg>`),
  iconSize: [36, 48],
  iconAnchor: [18, 48],
  popupAnchor: [0, -42],
});

const iconConsumidor = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`<svg xmlns='http://www.w3.org/2000/svg' width='36' height='48' viewBox='0 0 36 48'>
<path d='M18 0C8 0 0 8 0 18c0 13 18 30 18 30s18-17 18-30C36 8 28 0 18 0z' fill='#d18c22'/>
<circle cx='18' cy='18' r='7' fill='#fff'/>
</svg>`),
  iconSize: [36, 48],
  iconAnchor: [18, 48],
  popupAnchor: [0, -42],
});

export default function Mapa() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("TODOS");
  const toast = useToast();

  // ─── Brújula (DeviceOrientationEvent) ────────────────────────────────────
  const [heading, setHeading] = useState(null);
  const [brujulaActiva, setBrujulaActiva] = useState(false);
  const stopSensorRef = useRef(null);

  const activarBrujula = async () => {
    if (!sensores.isSupported()) {
      toast.error("Tu dispositivo no expone sensores de orientación.");
      return;
    }
    try {
      const permiso = await sensores.pedirPermiso();
      if (permiso !== "granted") {
        toast.error("Permiso de sensor denegado.");
        return;
      }
      stopSensorRef.current = sensores.escuchar((o) => {
        // alpha 0–360 indica rotación respecto al norte magnético (más fiable en móvil)
        if (o.alpha != null) setHeading(o.alpha);
      });
      setBrujulaActiva(true);
      toast.info("Brújula activada. Inclina/gira el teléfono.");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const desactivarBrujula = () => {
    stopSensorRef.current?.();
    stopSensorRef.current = null;
    setBrujulaActiva(false);
  };

  useEffect(() => () => stopSensorRef.current?.(), []);

  // ─── Carga de ubicaciones ────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.listUbicaciones();
        setData(data);
      } catch (e) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line
  }, []);

  const markers = useMemo(() => {
    if (!data) return [];
    if (filter === "PRODUCTORES") return data.productores || [];
    if (filter === "CONSUMIDORES") return data.consumidores || [];
    return data.markers || [];
  }, [data, filter]);

  const center = useMemo(() => {
    if (markers.length > 0) return [markers[0].latitud, markers[0].longitud];
    return [5.549, -73.363];
  }, [markers]);

  if (loading) return <Loading />;

  // La rosa de los vientos rota en sentido inverso al alpha para que la "N"
  // apunte al norte real. Si el alpha sube, el dispositivo gira en sentido
  // horario, así que la brújula debe rotar en sentido antihorario.
  const rotacion = heading != null ? -heading : 0;

  return (
    <div className="container map-page">
      <div className="page-head">
        <div>
          <span className="kicker">Territorio</span>
          <h1>Mapa de la red</h1>
          <p className="muted">
            {data?.total || 0} usuarios ubicados · {data?.productores?.length || 0} productores ·{" "}
            {data?.consumidores?.length || 0} consumidores
          </p>
        </div>
        <div className="chip-bar">
          <button
            className={`chip-btn ${filter === "TODOS" ? "active" : ""}`}
            onClick={() => setFilter("TODOS")}
          >
            Todos
          </button>
          <button
            className={`chip-btn ${filter === "PRODUCTORES" ? "active" : ""}`}
            onClick={() => setFilter("PRODUCTORES")}
          >
            🌱 Productores
          </button>
          <button
            className={`chip-btn ${filter === "CONSUMIDORES" ? "active" : ""}`}
            onClick={() => setFilter("CONSUMIDORES")}
          >
            🛒 Consumidores
          </button>
          {!brujulaActiva ? (
            <button className="chip-btn" onClick={activarBrujula}>
              🧭 Brújula
            </button>
          ) : (
            <button className="chip-btn active" onClick={desactivarBrujula}>
              🧭 Apagar
            </button>
          )}
        </div>
      </div>

      <div className="map-wrap card">
        <MapContainer center={center} zoom={7} style={{ height: "70vh", borderRadius: "14px" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markers.map((m) => (
            <Marker
              key={`${m.tipo}-${m.idUsuario}`}
              position={[m.latitud, m.longitud]}
              icon={m.tipo === "PRODUCTOR" ? iconProductor : iconConsumidor}
            >
              <Popup>
                <b>{m.nombre}</b>
                <br />
                {m.tipo === "PRODUCTOR" ? (
                  <>
                    🌱 {m.nombreFinca}
                    <br />
                    <Link to={`/productores/${m.idUsuario}`}>Ver perfil</Link>
                  </>
                ) : (
                  <>🛒 {m.direccion}</>
                )}
                {m.telefono && (
                  <>
                    <br />
                    📞 {m.telefono}
                  </>
                )}
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {brujulaActiva && (
          <div className="compass" aria-label="Brújula">
            <div
              className="compass-rose"
              style={{ transform: `rotate(${rotacion}deg)` }}
            >
              <span className="compass-n">N</span>
              <span className="compass-e">E</span>
              <span className="compass-s">S</span>
              <span className="compass-w">O</span>
              <div className="compass-arrow" />
            </div>
            <div className="compass-readout">
              {heading != null ? `${Math.round(heading)}°` : "—"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

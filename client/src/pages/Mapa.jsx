import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import Loading from "../components/Loading.jsx";
import { useToast } from "../context/ToastContext.jsx";

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
      </div>
    </div>
  );
}

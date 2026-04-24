import { useEffect, useState } from "react";
import { api } from "../api/client";
import Loading from "../components/Loading.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function Perfil() {
  const { user, isProductor, refresh } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (isProductor) {
          const { data } = await api.getProductor(user.idUsuario);
          setPerfil(data);
          setForm({
            nombreFinca: data.nombreFinca || "",
            ubicacionGPS: data.ubicacionGPS || "",
            horarioRecogida: data.horarioRecogida || "",
          });
        } else {
          const { data } = await api.getConsumidor(user.idUsuario);
          setPerfil(data);
          setForm({
            direccion: data.direccion || "",
            latitud: data.latitud ?? "",
            longitud: data.longitud ?? "",
          });
        }
      } catch (e) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line
  }, [user?.idUsuario]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const detectLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocalización no soportada");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm({
          ...form,
          latitud: pos.coords.latitude.toFixed(6),
          longitud: pos.coords.longitude.toFixed(6),
        });
        toast.success("Ubicación capturada");
      },
      () => toast.error("No se pudo obtener la ubicación")
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isProductor) {
        const body = {};
        if (form.nombreFinca) body.nombreFinca = form.nombreFinca;
        if (form.ubicacionGPS) body.ubicacionGPS = form.ubicacionGPS;
        if (form.horarioRecogida) body.horarioRecogida = form.horarioRecogida;
        await api.updateProductor(user.idUsuario, body);
      } else {
        const body = {};
        if (form.direccion) body.direccion = form.direccion;
        if (form.latitud !== "" && form.longitud !== "") {
          body.latitud = Number(form.latitud);
          body.longitud = Number(form.longitud);
        }
        await api.updateConsumidor(user.idUsuario, body);
      }
      toast.success("Perfil actualizado");
      await refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <span className="kicker">Mi cuenta</span>
          <h1>Perfil</h1>
          <p className="muted">Actualiza tu información personal y ubicación.</p>
        </div>
      </div>

      <div className="profile-grid">
        <div className="card">
          <div className="profile-head">
            <div className="profile-avatar">
              {user?.nombre?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2>{user?.nombre}</h2>
              <p className="muted">
                {user?.rol === "PRODUCTOR" ? "🌱 Productor" : "🛒 Consumidor"}
              </p>
            </div>
          </div>
          <dl className="dl">
            <dt>Correo</dt><dd>{user?.correo}</dd>
            <dt>Teléfono</dt><dd>{user?.telefono}</dd>
            <dt>ID</dt><dd>#{user?.idUsuario}</dd>
          </dl>
        </div>

        <form className="card" onSubmit={handleSubmit}>
          <h3>Datos de {isProductor ? "finca" : "consumidor"}</h3>
          {isProductor ? (
            <>
              <label className="field">
                <span>Nombre de finca</span>
                <input
                  name="nombreFinca"
                  value={form.nombreFinca || ""}
                  onChange={onChange}
                />
              </label>
              <label className="field">
                <span>Ubicación GPS (lat,lng)</span>
                <input
                  name="ubicacionGPS"
                  value={form.ubicacionGPS || ""}
                  onChange={onChange}
                />
              </label>
              <label className="field">
                <span>Horario de recogida</span>
                <input
                  name="horarioRecogida"
                  value={form.horarioRecogida || ""}
                  onChange={onChange}
                />
              </label>
            </>
          ) : (
            <>
              <label className="field">
                <span>Dirección</span>
                <input
                  name="direccion"
                  value={form.direccion || ""}
                  onChange={onChange}
                />
              </label>
              <div className="grid-2">
                <label className="field">
                  <span>Latitud</span>
                  <input
                    type="number"
                    step="any"
                    name="latitud"
                    value={form.latitud}
                    onChange={onChange}
                  />
                </label>
                <label className="field">
                  <span>Longitud</span>
                  <input
                    type="number"
                    step="any"
                    name="longitud"
                    value={form.longitud}
                    onChange={onChange}
                  />
                </label>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={detectLocation}
              >
                📍 Usar mi ubicación actual
              </button>
            </>
          )}
          <button className="btn btn-primary btn-block" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}

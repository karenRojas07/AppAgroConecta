import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

const padTime = (v) => (v ? v : "");

export default function Register() {
  const { registerProductor, registerConsumidor } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [rol, setRol] = useState("CONSUMIDOR");
  const [locMode, setLocMode] = useState("AUTO");
  const [busy, setBusy] = useState(false);
  const [coords, setCoords] = useState({ lat: "", lng: "", captured: false });

  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    clave: "",
    // consumidor
    direccion: "",
    // productor
    nombreFinca: "",
    horarioInicio: "",
    horarioFin: "",
  });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
          captured: true,
        });
        toast.success("Ubicación capturada");
      },
      () => toast.error("No se pudo obtener la ubicación")
    );
  };

  const getCoords = () => {
    if (locMode === "AUTO") {
      if (!coords.captured) return null;
      return { latitud: Number(coords.lat), longitud: Number(coords.lng) };
    }
    const lat = Number(coords.lat);
    const lng = Number(coords.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { latitud: lat, longitud: lng };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const geo = getCoords();
      if (!geo) {
        toast.error("Agrega tu ubicación (auto o manual)");
        setBusy(false);
        return;
      }

      if (rol === "CONSUMIDOR") {
        if (!form.direccion || form.direccion.length < 5) {
          toast.error("La dirección es requerida (mín. 5 caracteres)");
          setBusy(false);
          return;
        }
        const user = await registerConsumidor({
          nombre: form.nombre,
          correo: form.correo,
          telefono: form.telefono,
          clave: form.clave,
          direccion: form.direccion,
          latitud: geo.latitud,
          longitud: geo.longitud,
        });
        toast.success(`¡Bienvenido, ${user.nombre}!`);
        navigate("/");
      } else {
        if (!form.horarioInicio || !form.horarioFin) {
          toast.error("Indica el horario de recogida (inicio y fin)");
          setBusy(false);
          return;
        }
        const horarioRecogida = `${padTime(form.horarioInicio)} - ${padTime(form.horarioFin)}`;
        const user = await registerProductor({
          nombre: form.nombre,
          correo: form.correo,
          telefono: form.telefono,
          clave: form.clave,
          nombreFinca: form.nombreFinca,
          latitud: geo.latitud,
          longitud: geo.longitud,
          horarioRecogida,
        });
        toast.success(`¡Bienvenido, ${user.nombre}!`);
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error(err.message || "No se pudo registrar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container auth-layout">
      <div className="auth-side">
        <span className="kicker">Únete</span>
        <h1>Crea tu cuenta en AgroConecta</h1>
        <p className="lead">
          Elige tu rol y empieza a vender o comprar productos frescos del campo.
        </p>
        <div className="role-switch">
          <button
            type="button"
            className={`role-btn ${rol === "CONSUMIDOR" ? "active" : ""}`}
            onClick={() => setRol("CONSUMIDOR")}
          >
            <span className="role-ico">🛒</span>
            <div>
              <b>Soy consumidor</b>
              <p>Quiero comprar directo del productor</p>
            </div>
          </button>
          <button
            type="button"
            className={`role-btn ${rol === "PRODUCTOR" ? "active" : ""}`}
            onClick={() => setRol("PRODUCTOR")}
          >
            <span className="role-ico">🌱</span>
            <div>
              <b>Soy productor</b>
              <p>Quiero vender mi cosecha</p>
            </div>
          </button>
        </div>
      </div>

      <form className="card auth-card" onSubmit={handleSubmit}>
        <h2>Registro</h2>

        <div className="grid-2">
          <label className="field">
            <span>Nombre completo</span>
            <input name="nombre" value={form.nombre} onChange={onChange} minLength={3} required />
          </label>
          <label className="field">
            <span>Teléfono</span>
            <input name="telefono" value={form.telefono} onChange={onChange} minLength={7} required />
          </label>
        </div>

        <label className="field">
          <span>Correo</span>
          <input type="email" name="correo" value={form.correo} onChange={onChange} required />
        </label>

        <label className="field">
          <span>Clave</span>
          <input type="password" name="clave" value={form.clave} onChange={onChange} minLength={6} required />
        </label>

        {rol === "CONSUMIDOR" ? (
          <label className="field">
            <span>Dirección</span>
            <input name="direccion" value={form.direccion} onChange={onChange} minLength={5} required />
          </label>
        ) : (
          <>
            <label className="field">
              <span>Nombre de la finca</span>
              <input name="nombreFinca" value={form.nombreFinca} onChange={onChange} required />
            </label>
            <div className="grid-2">
              <label className="field">
                <span>Horario inicio</span>
                <input type="time" name="horarioInicio" value={form.horarioInicio} onChange={onChange} step={900} required />
              </label>
              <label className="field">
                <span>Horario fin</span>
                <input type="time" name="horarioFin" value={form.horarioFin} onChange={onChange} step={900} required />
              </label>
            </div>
          </>
        )}

        <div className="geo-card">
          <div className="geo-head">
            <b>📍 Ubicación</b>
            <div className="pill-group">
              <button
                type="button"
                className={`pill ${locMode === "AUTO" ? "active" : ""}`}
                onClick={() => setLocMode("AUTO")}
              >
                Automática
              </button>
              <button
                type="button"
                className={`pill ${locMode === "MANUAL" ? "active" : ""}`}
                onClick={() => setLocMode("MANUAL")}
              >
                Manual
              </button>
            </div>
          </div>

          {locMode === "AUTO" ? (
            <div>
              <button type="button" className="btn btn-ghost" onClick={detectLocation}>
                Usar mi ubicación actual
              </button>
              <p className="geo-text">
                {coords.captured
                  ? `✓ Lat ${coords.lat}, Lng ${coords.lng}`
                  : "Aún no se ha capturado tu ubicación."}
              </p>
            </div>
          ) : (
            <div className="grid-2">
              <label className="field">
                <span>Latitud</span>
                <input
                  type="number"
                  step="any"
                  value={coords.lat}
                  onChange={(e) => setCoords({ ...coords, lat: e.target.value })}
                  placeholder="5.549161"
                />
              </label>
              <label className="field">
                <span>Longitud</span>
                <input
                  type="number"
                  step="any"
                  value={coords.lng}
                  onChange={(e) => setCoords({ ...coords, lng: e.target.value })}
                  placeholder="-73.363238"
                />
              </label>
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? "Creando cuenta..." : "Crear cuenta"}
        </button>
        <p className="auth-foot">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </form>
    </div>
  );
}

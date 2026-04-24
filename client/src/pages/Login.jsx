import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [form, setForm] = useState({ correo: "", clave: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user = await login(form.correo, form.clave);
      toast.success(`Bienvenido, ${user.nombre}`);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message || "Credenciales inválidas");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container auth-layout">
      <div className="auth-side">
        <span className="kicker">Hola de nuevo</span>
        <h1>Inicia sesión en AgroConecta</h1>
        <p className="lead">
          Accede a tu panel, gestiona pedidos y descubre lo mejor del campo.
        </p>
        <ul className="auth-benefits">
          <li>✓ Tu catálogo y pedidos a un clic</li>
          <li>✓ Reseñas y confianza comunitaria</li>
          <li>✓ Mapa de productores y consumidores</li>
        </ul>
      </div>

      <form className="card auth-card" onSubmit={handleSubmit}>
        <h2>Entrar</h2>
        <label className="field">
          <span>Correo</span>
          <input
            type="email"
            name="correo"
            value={form.correo}
            onChange={handleChange}
            placeholder="correo@ejemplo.com"
            required
          />
        </label>
        <label className="field">
          <span>Clave</span>
          <input
            type="password"
            name="clave"
            value={form.clave}
            onChange={handleChange}
            placeholder="Tu clave"
            minLength={6}
            required
          />
        </label>
        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={submitting}
        >
          {submitting ? "Entrando..." : "Iniciar sesión"}
        </button>
        <p className="auth-foot">
          ¿Aún no tienes cuenta? <Link to="/registro">Regístrate</Link>
        </p>
      </form>
    </div>
  );
}

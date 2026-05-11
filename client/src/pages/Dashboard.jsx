import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client";
import Loading from "../components/Loading.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { formatCOP } from "../utils/format.js";
import { camera, blobToDataURL } from "../utils/perifericos.js";
import { crearProductoOfflineAware } from "../utils/syncManager.js";

const EMPTY_FORM = {
  nombre: "",
  descripcion: "",
  precio: "",
  cantidadDisponible: "",
  foto: "",
};

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // ─── Cámara para foto del producto ──────────────────────────────────────
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  const abrirCamara = async () => {
    try {
      const s = await camera.open("environment");
      setStream(s);
      // Esperar al siguiente tick para que el <video> ya esté montado
      requestAnimationFrame(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play();
        }
      });
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
      const blob = await camera.snapshot(videoRef.current, 0.75);
      // Guardamos la foto como Data URL (string) para mandarla al backend
      // y poder almacenarla offline en IndexedDB sin perder el binario.
      const dataUrl = await blobToDataURL(blob);
      setForm((f) => ({ ...f, foto: dataUrl }));
      cerrarCamara();
      toast.success(`Foto capturada (${Math.round(blob.size / 1024)} KB)`);
    } catch (e) {
      toast.error(e.message);
    }
  };

  useEffect(() => () => camera.stop(stream), [stream]);

  // ─── Carga de productos ──────────────────────────────────────────────────

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.listProductos({ idProductor: user.idUsuario });
      setProductos(data || []);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [user?.idUsuario]);

  const stats = useMemo(() => {
    const total = productos.length;
    const disponibles = productos.filter((p) => p.cantidadDisponible > 0).length;
    const valor = productos.reduce(
      (acc, p) => acc + Number(p.precio) * Number(p.cantidadDisponible),
      0
    );
    return { total, disponibles, valor };
  }, [productos]);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: p.precio,
      cantidadDisponible: p.cantidadDisponible,
      foto: p.foto || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        precio: Number(form.precio),
        cantidadDisponible: Number(form.cantidadDisponible),
      };
      if (form.foto?.trim()) payload.foto = form.foto.trim();

      if (editing) {
        await api.updateProducto(editing.idProducto, payload);
        toast.success("Producto actualizado");
      } else {
        // Usa el flujo offline-aware: si hay red, va al servidor;
        // si no, lo guarda en IndexedDB y encola para sincronizar.
        const res = await crearProductoOfflineAware({
          ...payload,
          idProductor: user.idUsuario,
          fotoLocal: form.foto,
        });
        if (res.local) {
          toast.info("Sin conexión: el producto se sincronizará al volver la red.");
        } else {
          toast.success("Producto publicado");
        }
      }
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      cerrarCamara();
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return;
    try {
      await api.deleteProducto(p.idProducto);
      toast.success("Producto eliminado");
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <span className="kicker">Panel de productor</span>
          <h1>Tus productos</h1>
          <p className="muted">Publica, edita y elimina productos de tu catálogo.</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          + Nuevo producto
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-num">{stats.total}</span>
          <span className="stat-label">Productos</span>
        </div>
        <div className="stat-card accent">
          <span className="stat-num">{stats.disponibles}</span>
          <span className="stat-label">Con stock</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{formatCOP(stats.valor)}</span>
          <span className="stat-label">Valor inventario</span>
        </div>
      </div>

      {showForm && (
        <div className="card form-card">
          <div className="form-head">
            <h3>{editing ? `Editar: ${editing.nombre}` : "Nuevo producto"}</h3>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
                cerrarCamara();
              }}
            >
              ×
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <label className="field">
              <span>Nombre</span>
              <input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
                minLength={2}
                maxLength={150}
              />
            </label>
            <label className="field">
              <span>Descripción</span>
              <textarea
                value={form.descripcion}
                onChange={(e) =>
                  setForm({ ...form, descripcion: e.target.value })
                }
                rows={3}
                required
                minLength={2}
                maxLength={2000}
              />
            </label>
            <div className="grid-2">
              <label className="field">
                <span>Precio (COP)</span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={form.precio}
                  onChange={(e) => setForm({ ...form, precio: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                <span>Cantidad disponible</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.cantidadDisponible}
                  onChange={(e) =>
                    setForm({ ...form, cantidadDisponible: e.target.value })
                  }
                  required
                />
              </label>
            </div>

            <div className="field">
              <span>Foto del producto</span>
              <div className="foto-tools">
                {!stream ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={abrirCamara}
                  >
                    📷 Usar cámara
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={tomarFoto}
                    >
                      Capturar
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={cerrarCamara}
                    >
                      Cancelar
                    </button>
                  </>
                )}
                {form.foto && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setForm({ ...form, foto: "" })}
                  >
                    Quitar foto
                  </button>
                )}
              </div>
              {stream && (
                <div className="device-video-wrap inline">
                  <video ref={videoRef} playsInline muted className="device-video" />
                </div>
              )}
              {form.foto && !stream && (
                <div className="device-snapshot inline">
                  <img src={form.foto} alt="vista previa" />
                </div>
              )}
              <input
                type="url"
                value={form.foto?.startsWith?.("data:") ? "" : form.foto}
                onChange={(e) => setForm({ ...form, foto: e.target.value })}
                placeholder="…o pega una URL https://"
                className="mt-sm"
              />
            </div>

            <button className="btn btn-primary btn-block" disabled={saving}>
              {saving ? "Guardando..." : editing ? "Guardar cambios" : "Publicar"}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <Loading />
      ) : productos.length === 0 ? (
        <div className="empty-state card">
          <h3>Aún no tienes productos</h3>
          <p>Publica tu primera cosecha para empezar a vender.</p>
          <button className="btn btn-primary" onClick={openNew}>
            + Publicar producto
          </button>
        </div>
      ) : (
        <div className="admin-list">
          {productos.map((p) => (
            <div key={p.idProducto} className="admin-row card">
              <div className="admin-media">
                {p.foto ? (
                  <img src={p.foto} alt={p.nombre} />
                ) : (
                  <div className="prod-placeholder sm">
                    <span>{p.nombre[0]}</span>
                  </div>
                )}
              </div>
              <div className="admin-info">
                <b>{p.nombre}</b>
                <p className="muted truncate">{p.descripcion}</p>
              </div>
              <div>
                <div className="muted">Precio</div>
                <b>{formatCOP(p.precio)}</b>
              </div>
              <div>
                <div className="muted">Stock</div>
                <b>{p.cantidadDisponible}</b>
              </div>
              <div className="admin-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>
                  Editar
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(p)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

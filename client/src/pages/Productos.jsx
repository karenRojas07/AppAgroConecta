import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import ProductCard from "../components/ProductCard.jsx";
import Loading from "../components/Loading.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { db } from "../utils/db.js";

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [onlyAvail, setOnlyAvail] = useState(false);
  const [sort, setSort] = useState("reciente");
  const { addItem } = useCart();
  const { isConsumidor } = useAuth();
  const toast = useToast();

  const [offline, setOffline] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.listProductos();
        setProductos(data || []);
        setOffline(false);
      } catch {
        // Sin conexión: leer desde el catálogo local en IndexedDB
        const local = await db.catalogo.getAll();
        if (local.length > 0) {
          setProductos(local);
          setOffline(true);
          toast.info("Modo offline: mostrando catálogo guardado localmente.");
        } else {
          toast.error("Sin conexión y no hay catálogo guardado localmente. Conéctate al menos una vez para ver productos.");
        }
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line
  }, []);

  const filtered = useMemo(() => {
    let items = productos;
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter(
        (p) =>
          p.nombre?.toLowerCase().includes(q) ||
          p.descripcion?.toLowerCase().includes(q)
      );
    }
    if (onlyAvail) items = items.filter((p) => p.cantidadDisponible > 0);
    if (sort === "precioAsc")
      items = [...items].sort((a, b) => Number(a.precio) - Number(b.precio));
    if (sort === "precioDesc")
      items = [...items].sort((a, b) => Number(b.precio) - Number(a.precio));
    if (sort === "nombre")
      items = [...items].sort((a, b) => a.nombre.localeCompare(b.nombre));
    return items;
  }, [productos, query, onlyAvail, sort]);

  const handleAdd = (p) => {
    if (!isConsumidor) {
      toast.info("Inicia sesión como consumidor para comprar");
      return;
    }
    addItem(p, 1);
    toast.success(`${p.nombre} añadido al carrito`);
  };

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <span className="kicker">Catálogo</span>
          <h1>Productos frescos</h1>
          <p className="muted">Explora lo que publican nuestros productores.</p>
        </div>
      </div>

      {offline && (
        <div className="alert-offline card" style={{ background: "#fff3cd", borderLeft: "4px solid #e6a817", padding: "0.75rem 1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>⚠️</span>
          <span>Estás sin conexión. Mostrando el catálogo guardado localmente.</span>
        </div>
      )}

      <div className="filter-bar card">
        <input
          type="search"
          placeholder="Buscar por nombre o descripción..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search"
        />
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="reciente">Más recientes</option>
          <option value="precioAsc">Precio: menor a mayor</option>
          <option value="precioDesc">Precio: mayor a menor</option>
          <option value="nombre">Nombre (A-Z)</option>
        </select>
        <label className="check">
          <input
            type="checkbox"
            checked={onlyAvail}
            onChange={(e) => setOnlyAvail(e.target.checked)}
          />
          <span>Solo disponibles</span>
        </label>
      </div>

      {loading ? (
        <Loading label="Cargando productos..." />
      ) : filtered.length === 0 ? (
        <div className="empty-state card">
          <h3>Sin resultados</h3>
          <p>Prueba con otra búsqueda o quita los filtros.</p>
        </div>
      ) : (
        <div className="grid-cards">
          {filtered.map((p) => (
            <ProductCard key={p.idProducto} producto={p} onAdd={handleAdd} />
          ))}
        </div>
      )}
    </div>
  );
}

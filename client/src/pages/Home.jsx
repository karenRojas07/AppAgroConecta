import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import ProductCard from "../components/ProductCard.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function Home() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ productores: 0, productos: 0 });
  const { addItem } = useCart();
  const { isConsumidor } = useAuth();
  const toast = useToast();

  useEffect(() => {
    (async () => {
      try {
        const [p, pr] = await Promise.all([
          api.listProductos(),
          api.listProductores(),
        ]);
        setProductos((p.data || []).slice(0, 8));
        setStats({
          productores: (pr.data || []).length,
          productos: (p.data || []).length,
        });
      } catch (e) {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAdd = (producto) => {
    if (!isConsumidor) {
      toast.info("Inicia sesión como consumidor para comprar");
      return;
    }
    addItem(producto, 1);
    toast.success(`${producto.nombre} añadido al carrito`);
  };

  return (
    <div>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-text">
            <span className="kicker">Comercio agrícola justo</span>
            <h1>
              Del campo a tu mesa,<br />
              <span className="hero-accent">sin intermediarios.</span>
            </h1>
            <p className="lead">
              Productores publican sus cosechas, consumidores compran directo.
              Menos barreras, precios más justos, impacto local real.
            </p>
            <div className="hero-ctas">
              <Link to="/productos" className="btn btn-primary">
                Explorar productos
              </Link>
              <Link to="/registro" className="btn btn-ghost">
                Crear cuenta
              </Link>
            </div>
            <div className="hero-chips">
              <span>🌱 Compra directa</span>
              <span>🚜 Recogida en finca</span>
              <span>🛵 Domicilio</span>
            </div>
          </div>

          <div className="hero-stats">
            <div className="stat-card">
              <span className="stat-num">{stats.productores}</span>
              <span className="stat-label">Productores</span>
            </div>
            <div className="stat-card accent">
              <span className="stat-num">{stats.productos}</span>
              <span className="stat-label">Productos</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">∞</span>
              <span className="stat-label">Sabor local</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="section-head">
          <h2>Lo más fresco</h2>
          <Link to="/productos" className="link">Ver todo →</Link>
        </div>

        {loading ? (
          <div className="grid-cards">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="prod-card skeleton" />
            ))}
          </div>
        ) : productos.length === 0 ? (
          <div className="empty-state card">
            <h3>Aún no hay productos publicados</h3>
            <p>¡Sé el primer productor en sumarse!</p>
          </div>
        ) : (
          <div className="grid-cards">
            {productos.map((p) => (
              <ProductCard key={p.idProducto} producto={p} onAdd={handleAdd} />
            ))}
          </div>
        )}
      </section>

      <section className="container">
        <div className="feature-grid">
          <div className="feature">
            <div className="feature-ico">🌾</div>
            <h3>Publica en minutos</h3>
            <p>Registra tu finca, sube fotos y publica tus productos frescos de forma sencilla.</p>
          </div>
          <div className="feature">
            <div className="feature-ico">📦</div>
            <h3>Pedidos claros</h3>
            <p>Gestiona el flujo: pendiente, confirmado, en preparación, listo, entregado.</p>
          </div>
          <div className="feature">
            <div className="feature-ico">⭐</div>
            <h3>Confianza comunitaria</h3>
            <p>Reseñas verificadas construyen reputación entre productores y consumidores.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

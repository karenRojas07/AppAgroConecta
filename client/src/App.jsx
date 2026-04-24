import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PWAStatus from "./components/PWAStatus.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Productos from "./pages/Productos.jsx";
import ProductoDetail from "./pages/ProductoDetail.jsx";
import Carrito from "./pages/Carrito.jsx";
import Pedidos from "./pages/Pedidos.jsx";
import PedidoDetail from "./pages/PedidoDetail.jsx";
import Productores from "./pages/Productores.jsx";
import ProductorDetail from "./pages/ProductorDetail.jsx";
import Perfil from "./pages/Perfil.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Resenas from "./pages/Resenas.jsx";
import Mapa from "./pages/Mapa.jsx";
import NotFound from "./pages/NotFound.jsx";
import { useAuth } from "./context/AuthContext.jsx";

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="boot-screen">
        <div className="boot-logo">AgroConecta</div>
        <div className="boot-spinner" />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <PWAStatus />
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/productos/:id" element={<ProductoDetail />} />
          <Route path="/productores" element={<Productores />} />
          <Route path="/productores/:id" element={<ProductorDetail />} />
          <Route path="/mapa" element={<Mapa />} />

          <Route
            path="/carrito"
            element={
              <ProtectedRoute rol="CONSUMIDOR">
                <Carrito />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pedidos"
            element={
              <ProtectedRoute>
                <Pedidos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pedidos/:id"
            element={
              <ProtectedRoute>
                <PedidoDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute rol="PRODUCTOR">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resenas"
            element={
              <ProtectedRoute>
                <Resenas />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

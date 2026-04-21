const express = require("express");
const authRoutes = require("./auth.routes");
const productoresRoutes = require("./productores.routes");
const consumidoresRoutes = require("./consumidores.routes");
const productosRoutes = require("./productos.routes");
const pedidosRoutes = require("./pedidos.routes");
const resenasRoutes = require("./resenas.routes");
const ubicacionesRoutes = require("./ubicaciones.routes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AgroConecta API operativa",
    timestamp: new Date().toISOString(),
  });
});

router.use("/auth", authRoutes);
router.use("/productores", productoresRoutes);
router.use("/consumidores", consumidoresRoutes);
router.use("/productos", productosRoutes);
router.use("/pedidos", pedidosRoutes);
router.use("/resenas", resenasRoutes);
router.use("/ubicaciones", ubicacionesRoutes);

module.exports = router;

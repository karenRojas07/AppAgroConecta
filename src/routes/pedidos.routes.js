const express = require("express");
const { authenticate } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
  pedidoCreateSchema,
  pedidoEstadoSchema,
  pedidoParamsSchema,
} = require("../validators/pedido.validator");
const {
  listPedidos,
  getPedidoById,
  createPedido,
  cambiarEstadoPedido,
} = require("../controllers/pedidos.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", listPedidos);
router.get("/:idPedido", validate(pedidoParamsSchema), getPedidoById);
router.post("/", validate(pedidoCreateSchema), createPedido);
router.patch("/:idPedido/estado", validate(pedidoEstadoSchema), cambiarEstadoPedido);

module.exports = router;

const express = require("express");
const { authenticate } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
  productoCreateSchema,
  productoUpdateSchema,
  productoParamsSchema,
} = require("../validators/producto.validator");
const {
  listProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
} = require("../controllers/productos.controller");

const router = express.Router();

router.get("/", listProductos);
router.get("/:idProducto", validate(productoParamsSchema), getProductoById);
router.post("/", authenticate, validate(productoCreateSchema), createProducto);
router.patch("/:idProducto", authenticate, validate(productoUpdateSchema), updateProducto);
router.delete("/:idProducto", authenticate, validate(productoParamsSchema), deleteProducto);

module.exports = router;

const express = require("express");
const { authenticate } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { usuarioParamsSchema, productorUpdateSchema } = require("../validators/perfil.validator");
const {
  listProductores,
  getProductorById,
  updateProductor,
} = require("../controllers/productores.controller");

const router = express.Router();

router.get("/", listProductores);
router.get("/:idUsuario", validate(usuarioParamsSchema), getProductorById);
router.patch("/:idUsuario", authenticate, validate(productorUpdateSchema), updateProductor);

module.exports = router;

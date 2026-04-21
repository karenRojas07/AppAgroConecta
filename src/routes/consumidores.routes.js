const express = require("express");
const { authenticate } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { usuarioParamsSchema, consumidorUpdateSchema } = require("../validators/perfil.validator");
const {
  listConsumidores,
  getConsumidorById,
  updateConsumidor,
} = require("../controllers/consumidores.controller");

const router = express.Router();

router.get("/", listConsumidores);
router.get("/:idUsuario", validate(usuarioParamsSchema), getConsumidorById);
router.patch("/:idUsuario", authenticate, validate(consumidorUpdateSchema), updateConsumidor);

module.exports = router;

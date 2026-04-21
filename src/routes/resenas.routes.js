const express = require("express");
const { authenticate } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { resenaCreateSchema, resenaParamsSchema } = require("../validators/resena.validator");
const { listResenas, getResenaById, createResena } = require("../controllers/resenas.controller");

const router = express.Router();

router.get("/", authenticate, listResenas);
router.get("/:idResena", authenticate, validate(resenaParamsSchema), getResenaById);
router.post("/", authenticate, validate(resenaCreateSchema), createResena);

module.exports = router;

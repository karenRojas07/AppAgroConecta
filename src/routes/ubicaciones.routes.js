const express = require("express");
const { listUbicaciones } = require("../controllers/ubicaciones.controller");

const router = express.Router();

router.get("/", listUbicaciones);

module.exports = router;

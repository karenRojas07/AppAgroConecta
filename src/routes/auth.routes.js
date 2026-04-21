const express = require("express");
const validate = require("../middlewares/validate");
const { authenticate } = require("../middlewares/auth");
const {
	registerProductorSchema,
	registerConsumidorSchema,
	loginSchema,
} = require("../validators/auth.validator");
const {
	registerProductor,
	registerConsumidor,
	login,
	me,
	logout,
} = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register/productor", validate(registerProductorSchema), registerProductor);
router.post("/register/consumidor", validate(registerConsumidorSchema), registerConsumidor);
router.post("/login", validate(loginSchema), login);
router.get("/me", authenticate, me);
router.post("/logout", authenticate, logout);

module.exports = router;

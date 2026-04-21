const ApiError = require("../utils/apiError");
const { verifyToken } = require("../utils/jwt");
const { Usuario } = require("../models");

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(401, "Token no proporcionado"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    const user = await Usuario.findByPk(decoded.idUsuario, {
      attributes: ["idUsuario", "rol", "nombre", "correo", "tokenSesion"],
    });

    if (!user || user.tokenSesion !== token) {
      return next(new ApiError(401, "Sesion invalida"));
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(new ApiError(401, "Token invalido o expirado"));
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.rol)) {
    return next(new ApiError(403, "No autorizado para esta operacion"));
  }

  return next();
};

module.exports = {
  authenticate,
  authorize,
};

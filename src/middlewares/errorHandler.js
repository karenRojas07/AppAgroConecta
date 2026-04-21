const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require("sequelize");
const ApiError = require("../utils/apiError");

const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }

  if (err instanceof ValidationError || err instanceof UniqueConstraintError) {
    return res.status(400).json({
      success: false,
      message: "Error de validacion en base de datos",
      details: err.errors?.map((e) => ({ field: e.path, message: e.message })) || [],
    });
  }

  if (err instanceof ForeignKeyConstraintError) {
    return res.status(400).json({
      success: false,
      message: "Referencia invalida: la entidad asociada no existe",
    });
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    message: "Error interno del servidor",
  });
};

module.exports = errorHandler;

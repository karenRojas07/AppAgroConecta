const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/apiError");
const { ok } = require("../utils/apiResponse");
const { Consumidor, Usuario } = require("../models");

const listConsumidores = catchAsync(async (req, res) => {
  const items = await Consumidor.findAll({
    include: [{ model: Usuario, as: "usuario", attributes: ["idUsuario", "nombre", "correo", "telefono"] }],
    order: [["idUsuario", "DESC"]],
  });
  return ok(res, items, "Consumidores listados");
});

const getConsumidorById = catchAsync(async (req, res, next) => {
  const idUsuario = req.validated.params.idUsuario;
  const item = await Consumidor.findByPk(idUsuario, {
    include: [{ model: Usuario, as: "usuario", attributes: ["idUsuario", "nombre", "correo", "telefono"] }],
  });

  if (!item) return next(new ApiError(404, "Consumidor no encontrado"));
  return ok(res, item, "Consumidor encontrado");
});

const updateConsumidor = catchAsync(async (req, res, next) => {
  const idUsuario = req.validated.params.idUsuario;
  const item = await Consumidor.findByPk(idUsuario);

  if (!item) return next(new ApiError(404, "Consumidor no encontrado"));
  if (req.user.idUsuario !== idUsuario) {
    return next(new ApiError(403, "No autorizado"));
  }

  const changes = { ...req.validated.body };
  if (typeof changes.latitud !== "undefined" && typeof changes.longitud !== "undefined") {
    changes.ubicacion = `${changes.latitud},${changes.longitud}`;
  }

  await item.update(changes);
  return ok(res, item, "Perfil de consumidor actualizado");
});

module.exports = {
  listConsumidores,
  getConsumidorById,
  updateConsumidor,
};

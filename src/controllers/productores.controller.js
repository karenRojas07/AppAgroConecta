const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/apiError");
const { ok } = require("../utils/apiResponse");
const { Productor, Usuario } = require("../models");

const listProductores = catchAsync(async (req, res) => {
  const items = await Productor.findAll({
    include: [{ model: Usuario, as: "usuario", attributes: ["idUsuario", "nombre", "correo", "telefono"] }],
    order: [["idUsuario", "DESC"]],
  });
  return ok(res, items, "Productores listados");
});

const getProductorById = catchAsync(async (req, res, next) => {
  const idUsuario = req.validated.params.idUsuario;
  const item = await Productor.findByPk(idUsuario, {
    include: [{ model: Usuario, as: "usuario", attributes: ["idUsuario", "nombre", "correo", "telefono"] }],
  });

  if (!item) return next(new ApiError(404, "Productor no encontrado"));
  return ok(res, item, "Productor encontrado");
});

const updateProductor = catchAsync(async (req, res, next) => {
  const idUsuario = req.validated.params.idUsuario;
  const item = await Productor.findByPk(idUsuario);

  if (!item) return next(new ApiError(404, "Productor no encontrado"));
  if (req.user.idUsuario !== idUsuario) {
    return next(new ApiError(403, "No autorizado"));
  }

  await item.update(req.validated.body);
  return ok(res, item, "Perfil de productor actualizado");
});

module.exports = {
  listProductores,
  getProductorById,
  updateProductor,
};

const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/apiError");
const { ok } = require("../utils/apiResponse");
const { Resena, Pedido } = require("../models");

const listResenas = catchAsync(async (req, res) => {
  const where = {};
  if (req.query.idProductor) where.idProductor = Number(req.query.idProductor);
  if (req.user.rol === "CONSUMIDOR") where.idConsumidor = req.user.idUsuario;

  const items = await Resena.findAll({ where, order: [["idResena", "DESC"]] });
  return ok(res, items, "Resenas listadas");
});

const getResenaById = catchAsync(async (req, res, next) => {
  const { idResena } = req.validated.params;
  const item = await Resena.findByPk(idResena);
  if (!item) return next(new ApiError(404, "Resena no encontrada"));
  return ok(res, item, "Resena encontrada");
});

const createResena = catchAsync(async (req, res, next) => {
  if (req.user.rol !== "CONSUMIDOR") {
    return next(new ApiError(403, "Solo consumidor puede crear resenas"));
  }

  const { idPedido, idProductor, calificacion, comentario } = req.validated.body;
  const pedido = await Pedido.findByPk(idPedido);
  if (!pedido) return next(new ApiError(400, "Pedido no encontrado"));

  if (pedido.idConsumidor !== req.user.idUsuario) {
    return next(new ApiError(403, "No puedes resenar un pedido que no te pertenece"));
  }

  if (pedido.estado !== "ENTREGADO") {
    return next(new ApiError(400, "Solo se pueden resenar pedidos ENTREGADOS"));
  }

  const existente = await Resena.findOne({ where: { idPedido } });
  if (existente) return next(new ApiError(409, "Este pedido ya tiene resena"));

  const item = await Resena.create({
    idPedido,
    idConsumidor: pedido.idConsumidor,
    idProductor,
    calificacion,
    comentario,
  });

  return ok(res, item, "Resena publicada", 201);
});

module.exports = {
  listResenas,
  getResenaById,
  createResena,
};

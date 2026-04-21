const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/apiError");
const { ok } = require("../utils/apiResponse");
const { Producto } = require("../models");

const listProductos = catchAsync(async (req, res) => {
  const where = {};
  if (req.query.idProductor) where.idProductor = Number(req.query.idProductor);
  const items = await Producto.findAll({ where, order: [["idProducto", "DESC"]] });
  return ok(res, items, "Productos listados");
});

const getProductoById = catchAsync(async (req, res, next) => {
  const { idProducto } = req.validated.params;
  const item = await Producto.findByPk(idProducto);
  if (!item) return next(new ApiError(404, "Producto no encontrado"));
  return ok(res, item, "Producto encontrado");
});

const createProducto = catchAsync(async (req, res, next) => {
  if (req.user.rol !== "PRODUCTOR") {
    return next(new ApiError(403, "Solo productor puede publicar"));
  }

  const item = await Producto.create({
    ...req.validated.body,
    idProductor: req.user.idUsuario,
  });

  return ok(res, item, "Producto publicado", 201);
});

const updateProducto = catchAsync(async (req, res, next) => {
  const { idProducto } = req.validated.params;
  const item = await Producto.findByPk(idProducto);
  if (!item) return next(new ApiError(404, "Producto no encontrado"));

  if (req.user.idUsuario !== item.idProductor) {
    return next(new ApiError(403, "No autorizado para editar este producto"));
  }

  await item.update(req.validated.body);
  return ok(res, item, "Producto actualizado");
});

const deleteProducto = catchAsync(async (req, res, next) => {
  const { idProducto } = req.validated.params;
  const item = await Producto.findByPk(idProducto);
  if (!item) return next(new ApiError(404, "Producto no encontrado"));

  if (req.user.idUsuario !== item.idProductor) {
    return next(new ApiError(403, "No autorizado para eliminar este producto"));
  }

  await item.destroy();
  return ok(res, null, "Producto eliminado");
});

module.exports = {
  listProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
};

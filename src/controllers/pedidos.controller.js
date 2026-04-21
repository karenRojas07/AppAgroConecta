const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/apiError");
const { ok } = require("../utils/apiResponse");
const { sequelize, Pedido, DetallePedido, Producto } = require("../models");

const recalcularTotal = (detalles, costoEnvio) => {
  const base = detalles.reduce((acc, d) => acc + Number(d.subtotal), 0);
  return Number(base + Number(costoEnvio || 0));
};

const listPedidos = catchAsync(async (req, res) => {
  const where = {};
  if (req.user.rol === "CONSUMIDOR") where.idConsumidor = req.user.idUsuario;

  const items = await Pedido.findAll({
    where,
    include: [{ model: DetallePedido, as: "detalles" }],
    order: [["idPedido", "DESC"]],
  });

  return ok(res, items, "Pedidos listados");
});

const getPedidoById = catchAsync(async (req, res, next) => {
  const { idPedido } = req.validated.params;
  const item = await Pedido.findByPk(idPedido, { include: [{ model: DetallePedido, as: "detalles" }] });
  if (!item) return next(new ApiError(404, "Pedido no encontrado"));

  if (req.user.rol === "CONSUMIDOR" && req.user.idUsuario !== item.idConsumidor) {
    return next(new ApiError(403, "No autorizado para ver este pedido"));
  }

  return ok(res, item, "Pedido encontrado");
});

const createPedido = catchAsync(async (req, res, next) => {
  if (req.user.rol !== "CONSUMIDOR") {
    return next(new ApiError(403, "Solo consumidor puede crear pedidos"));
  }

  const { tipoEntrega, costoEnvio = 0, detalles } = req.validated.body;
  const transaction = await sequelize.transaction();

  try {
    const pedido = await Pedido.create(
      {
        idConsumidor: req.user.idUsuario,
        tipoEntrega,
        costoEnvio,
        estado: "PENDIENTE",
        total: 0,
      },
      { transaction }
    );

    const detalleRows = [];
    for (const detalle of detalles) {
      const producto = await Producto.findByPk(detalle.idProducto, { transaction });
      if (!producto) throw new ApiError(400, `Producto ${detalle.idProducto} no existe`);
      if (producto.cantidadDisponible < detalle.cantidad) {
        throw new ApiError(400, `Cantidad insuficiente para ${producto.nombre}`);
      }

      const subtotal = Number(producto.precio) * Number(detalle.cantidad);
      detalleRows.push({
        idPedido: pedido.idPedido,
        idProducto: producto.idProducto,
        cantidad: detalle.cantidad,
        precioUnitario: producto.precio,
        subtotal,
      });

      await producto.update(
        { cantidadDisponible: producto.cantidadDisponible - detalle.cantidad },
        { transaction }
      );
    }

    await DetallePedido.bulkCreate(detalleRows, { transaction });
    await pedido.update({ total: recalcularTotal(detalleRows, costoEnvio) }, { transaction });

    await transaction.commit();
    const creado = await Pedido.findByPk(pedido.idPedido, { include: [{ model: DetallePedido, as: "detalles" }] });
    return ok(res, creado, "Pedido creado", 201);
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
});

const cambiarEstadoPedido = catchAsync(async (req, res, next) => {
  const { idPedido } = req.validated.params;
  const { estado } = req.validated.body;

  const item = await Pedido.findByPk(idPedido);
  if (!item) return next(new ApiError(404, "Pedido no encontrado"));

  if (req.user.rol !== "PRODUCTOR") {
    return next(new ApiError(403, "Solo productor puede cambiar estado"));
  }

  await item.update({ estado });
  return ok(res, item, "Estado del pedido actualizado");
});

module.exports = {
  listPedidos,
  getPedidoById,
  createPedido,
  cambiarEstadoPedido,
};

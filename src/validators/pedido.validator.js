const { z, idNumero } = require("./common");

const detalleInputSchema = z.object({
  idProducto: idNumero,
  cantidad: z.coerce.number().int().positive(),
});

const pedidoCreateSchema = z.object({
  body: z.object({
    tipoEntrega: z.enum(["RECOGIDA_FINCA", "DOMICILIO"]),
    costoEnvio: z.coerce.number().nonnegative().optional(),
    detalles: z.array(detalleInputSchema).min(1),
  }),
  params: z.object({}),
  query: z.object({}),
});

const pedidoEstadoSchema = z.object({
  body: z.object({
    estado: z.enum([
      "PENDIENTE",
      "CONFIRMADO",
      "EN_PREPARACION",
      "LISTO",
      "ENTREGADO",
      "CANCELADO",
    ]),
  }),
  params: z.object({ idPedido: idNumero }),
  query: z.object({}),
});

const pedidoParamsSchema = z.object({
  body: z.object({}),
  params: z.object({ idPedido: idNumero }),
  query: z.object({}),
});

module.exports = {
  pedidoCreateSchema,
  pedidoEstadoSchema,
  pedidoParamsSchema,
};

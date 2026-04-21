const { z, idNumero } = require("./common");

const resenaCreateSchema = z.object({
  body: z.object({
    idPedido: idNumero,
    idProductor: idNumero,
    calificacion: z.coerce.number().int().min(1).max(5),
    comentario: z.string().min(2).max(1500),
  }),
  params: z.object({}),
  query: z.object({}),
});

const resenaParamsSchema = z.object({
  body: z.object({}),
  params: z.object({ idResena: idNumero }),
  query: z.object({}),
});

module.exports = {
  resenaCreateSchema,
  resenaParamsSchema,
};

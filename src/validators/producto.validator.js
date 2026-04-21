const { z, idNumero, decimalPositivo } = require("./common");

const productoCreateSchema = z.object({
  body: z.object({
    nombre: z.string().min(2).max(150),
    descripcion: z.string().min(2).max(2000),
    precio: decimalPositivo,
    cantidadDisponible: z.coerce.number().int().nonnegative(),
    foto: z.string().url().optional(),
  }),
  params: z.object({}),
  query: z.object({}),
});

const productoUpdateSchema = z.object({
  body: z
    .object({
      nombre: z.string().min(2).max(150).optional(),
      descripcion: z.string().min(2).max(2000).optional(),
      precio: decimalPositivo.optional(),
      cantidadDisponible: z.coerce.number().int().nonnegative().optional(),
      foto: z.string().url().optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: "Debes enviar al menos un campo" }),
  params: z.object({ idProducto: idNumero }),
  query: z.object({}),
});

const productoParamsSchema = z.object({
  body: z.object({}),
  params: z.object({ idProducto: idNumero }),
  query: z.object({}),
});

module.exports = {
  productoCreateSchema,
  productoUpdateSchema,
  productoParamsSchema,
};

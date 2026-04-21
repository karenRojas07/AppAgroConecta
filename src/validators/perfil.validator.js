const { z, idNumero } = require("./common");

const productorUpdateSchema = z.object({
  body: z
    .object({
      nombreFinca: z.string().min(2).max(180).optional(),
      ubicacionGPS: z.string().min(3).max(180).optional(),
      horarioRecogida: z.string().min(3).max(120).optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: "Debes enviar al menos un campo" }),
  params: z.object({ idUsuario: idNumero }),
  query: z.object({}),
});

const consumidorUpdateSchema = z.object({
  body: z
    .object({
      direccion: z.string().min(5).max(220).optional(),
      ubicacion: z.string().min(3).max(180).optional(),
      latitud: z.coerce.number().min(-90).max(90).optional(),
      longitud: z.coerce.number().min(-180).max(180).optional(),
    })
    .refine((v) => !("latitud" in v) || ("longitud" in v), {
      message: "Si envias latitud, tambien debes enviar longitud",
    })
    .refine((v) => !("longitud" in v) || ("latitud" in v), {
      message: "Si envias longitud, tambien debes enviar latitud",
    })
    .refine((v) => Object.keys(v).length > 0, { message: "Debes enviar al menos un campo" }),
  params: z.object({ idUsuario: idNumero }),
  query: z.object({}),
});

const usuarioParamsSchema = z.object({
  body: z.object({}),
  params: z.object({ idUsuario: idNumero }),
  query: z.object({}),
});

module.exports = {
  productorUpdateSchema,
  consumidorUpdateSchema,
  usuarioParamsSchema,
};

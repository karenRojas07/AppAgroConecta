const { z } = require("./common");

const registerProductorSchema = z.object({
  body: z.object({
    nombre: z.string().min(3).max(120),
    correo: z.email(),
    telefono: z.string().min(7).max(40),
    clave: z.string().min(6).max(72),
    nombreFinca: z.string().min(2).max(180),
    latitud: z.coerce.number().min(-90).max(90),
    longitud: z.coerce.number().min(-180).max(180),
    horarioRecogida: z.string().min(3).max(120),
  }),
  params: z.object({}),
  query: z.object({}),
});

const registerConsumidorSchema = z.object({
  body: z.object({
    nombre: z.string().min(3).max(120),
    correo: z.email(),
    telefono: z.string().min(7).max(40),
    clave: z.string().min(6).max(72),
    direccion: z.string().min(5).max(220),
    latitud: z.coerce.number().min(-90).max(90),
    longitud: z.coerce.number().min(-180).max(180),
  }),
  params: z.object({}),
  query: z.object({}),
});

const loginSchema = z.object({
  body: z.object({
    correo: z.email(),
    clave: z.string().min(6).max(72),
  }),
  params: z.object({}),
  query: z.object({}),
});

module.exports = {
  registerProductorSchema,
  registerConsumidorSchema,
  loginSchema,
};

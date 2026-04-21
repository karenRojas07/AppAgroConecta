const { z } = require("zod");

const idNumero = z.coerce.number().int().positive();
const idTexto = z.string().min(1).max(120);
const decimalPositivo = z.coerce.number().nonnegative();

module.exports = {
  z,
  idNumero,
  idTexto,
  decimalPositivo,
};

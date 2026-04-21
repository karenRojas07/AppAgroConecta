const catchAsync = require("../utils/catchAsync");
const { ok } = require("../utils/apiResponse");
const { Usuario, Productor, Consumidor } = require("../models");

const listUbicaciones = catchAsync(async (req, res) => {
  const [productores, consumidores] = await Promise.all([
    Productor.findAll({
      include: [
        {
          model: Usuario,
          as: "usuario",
          attributes: ["idUsuario", "nombre", "correo", "telefono", "rol"],
        },
      ],
      attributes: ["idUsuario", "nombreFinca", "latitud", "longitud"],
    }),
    Consumidor.findAll({
      include: [
        {
          model: Usuario,
          as: "usuario",
          attributes: ["idUsuario", "nombre", "correo", "telefono", "rol"],
        },
      ],
      attributes: ["idUsuario", "direccion", "latitud", "longitud"],
    }),
  ]);

  const markersProductores = productores
    .filter((p) => p.latitud !== null && p.longitud !== null)
    .map((p) => ({
      tipo: "PRODUCTOR",
      idUsuario: p.idUsuario,
      nombre: p.usuario?.nombre,
      correo: p.usuario?.correo,
      telefono: p.usuario?.telefono,
      nombreFinca: p.nombreFinca,
      latitud: Number(p.latitud),
      longitud: Number(p.longitud),
    }));

  const markersConsumidores = consumidores
    .filter((c) => c.latitud !== null && c.longitud !== null)
    .map((c) => ({
      tipo: "CONSUMIDOR",
      idUsuario: c.idUsuario,
      nombre: c.usuario?.nombre,
      correo: c.usuario?.correo,
      telefono: c.usuario?.telefono,
      direccion: c.direccion,
      latitud: Number(c.latitud),
      longitud: Number(c.longitud),
    }));

  return ok(
    res,
    {
      total: markersProductores.length + markersConsumidores.length,
      productores: markersProductores,
      consumidores: markersConsumidores,
      markers: [...markersProductores, ...markersConsumidores],
    },
    "Ubicaciones de usuarios obtenidas"
  );
});

module.exports = {
  listUbicaciones,
};

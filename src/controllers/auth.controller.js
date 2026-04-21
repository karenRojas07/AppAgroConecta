const bcrypt = require("bcryptjs");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/apiError");
const { ok } = require("../utils/apiResponse");
const { signToken } = require("../utils/jwt");
const { sequelize, Usuario, Productor, Consumidor } = require("../models");

const toSafeUser = (user, perfil = null) => ({
  idUsuario: user.idUsuario,
  rol: user.rol,
  nombre: user.nombre,
  correo: user.correo,
  telefono: user.telefono,
  ultimoAcceso: user.ultimoAcceso,
  perfil,
});

const registerProductor = catchAsync(async (req, res, next) => {
  const { nombre, correo, telefono, clave, nombreFinca, latitud, longitud, horarioRecogida } =
    req.validated.body;

  const existing = await Usuario.findOne({ where: { correo } });
  if (existing) {
    return next(new ApiError(409, "Ya existe un usuario con ese correo"));
  }

  const transaction = await sequelize.transaction();
  try {
    const passwordHash = await bcrypt.hash(clave, 10);
    const user = await Usuario.create(
      {
        rol: "PRODUCTOR",
        nombre,
        correo,
        telefono,
        clave: passwordHash,
        ultimoAcceso: new Date(),
      },
      { transaction }
    );

    const perfil = await Productor.create(
      {
        idUsuario: user.idUsuario,
        nombreFinca,
        ubicacionGPS: `${latitud},${longitud}`,
        latitud,
        longitud,
        horarioRecogida,
      },
      { transaction }
    );

    const token = signToken({ idUsuario: user.idUsuario, rol: user.rol });
    await user.update({ tokenSesion: token, ultimoAcceso: new Date() }, { transaction });

    await transaction.commit();
    return ok(res, { token, user: toSafeUser(user, perfil) }, "Productor registrado", 201);
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
});

const registerConsumidor = catchAsync(async (req, res, next) => {
  const { nombre, correo, telefono, clave, direccion, latitud, longitud } = req.validated.body;

  const existing = await Usuario.findOne({ where: { correo } });
  if (existing) {
    return next(new ApiError(409, "Ya existe un usuario con ese correo"));
  }

  const transaction = await sequelize.transaction();
  try {
    const passwordHash = await bcrypt.hash(clave, 10);
    const user = await Usuario.create(
      {
        rol: "CONSUMIDOR",
        nombre,
        correo,
        telefono,
        clave: passwordHash,
        ultimoAcceso: new Date(),
      },
      { transaction }
    );

    const perfil = await Consumidor.create(
      {
        idUsuario: user.idUsuario,
        direccion,
        ubicacion: `${latitud},${longitud}`,
        latitud,
        longitud,
      },
      { transaction }
    );

    const token = signToken({ idUsuario: user.idUsuario, rol: user.rol });
    await user.update({ tokenSesion: token, ultimoAcceso: new Date() }, { transaction });

    await transaction.commit();
    return ok(res, { token, user: toSafeUser(user, perfil) }, "Consumidor registrado", 201);
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
});

const login = catchAsync(async (req, res, next) => {
  const { correo, clave } = req.validated.body;

  const user = await Usuario.findOne({ where: { correo } });
  if (!user) {
    return next(new ApiError(401, "Credenciales invalidas"));
  }

  const match = await bcrypt.compare(clave, user.clave);
  if (!match) {
    return next(new ApiError(401, "Credenciales invalidas"));
  }

  const token = signToken({ idUsuario: user.idUsuario, rol: user.rol });
  await user.update({ tokenSesion: token, ultimoAcceso: new Date() });

  const perfil =
    user.rol === "PRODUCTOR"
      ? await Productor.findByPk(user.idUsuario)
      : await Consumidor.findByPk(user.idUsuario);

  return ok(
    res,
    {
      token,
      user: toSafeUser(user, perfil),
    },
    "Inicio de sesion exitoso"
  );
});

const me = catchAsync(async (req, res) => {
  return ok(res, req.user, "Perfil actual");
});

const logout = catchAsync(async (req, res) => {
  await req.user.update({ tokenSesion: null });
  return ok(res, null, "Sesion cerrada");
});

module.exports = {
  registerProductor,
  registerConsumidor,
  login,
  me,
  logout,
};

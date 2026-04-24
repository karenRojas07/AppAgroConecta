const { DataTypes } = require("sequelize");
const sequelize = require("../db/sequelize");

const Usuario = sequelize.define(
  "Usuario",
  {
    idUsuario: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    correo: {
      type: DataTypes.STRING(180),
      allowNull: false,
      unique: "uq_usuarios_correo",
      validate: {
        isEmail: true,
      },
    },
    telefono: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    clave: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rol: {
      type: DataTypes.ENUM("PRODUCTOR", "CONSUMIDOR"),
      allowNull: false,
    },
    tokenSesion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ultimoAcceso: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "usuarios",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Usuario;

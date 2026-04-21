const { DataTypes } = require("sequelize");
const sequelize = require("../db/sequelize");

const Consumidor = sequelize.define(
  "Consumidor",
  {
    idUsuario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    direccion: {
      type: DataTypes.STRING(220),
      allowNull: false,
    },
    ubicacion: {
      type: DataTypes.STRING(180),
      allowNull: true,
    },
    latitud: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
    },
    longitud: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
    },
  },
  {
    tableName: "consumidores",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Consumidor;

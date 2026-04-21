const { DataTypes } = require("sequelize");
const sequelize = require("../db/sequelize");

const Productor = sequelize.define(
  "Productor",
  {
    idUsuario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    nombreFinca: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },
    ubicacionGPS: {
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
    horarioRecogida: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
  },
  {
    tableName: "productores",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Productor;

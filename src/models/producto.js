const { DataTypes } = require("sequelize");
const sequelize = require("../db/sequelize");

const Producto = sequelize.define(
  "Producto",
  {
    idProducto: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    idProductor: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    precio: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: { min: 0 },
    },
    cantidadDisponible: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0 },
    },
    foto: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "productos",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Producto;

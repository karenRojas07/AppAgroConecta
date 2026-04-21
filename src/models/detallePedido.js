const { DataTypes } = require("sequelize");
const sequelize = require("../db/sequelize");

const DetallePedido = sequelize.define(
  "DetallePedido",
  {
    idDetallePedido: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    idPedido: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    idProducto: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    precioUnitario: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: { min: 0 },
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: { min: 0 },
    },
  },
  {
    tableName: "detalle_pedidos",
    timestamps: true,
    underscored: true,
  }
);

module.exports = DetallePedido;

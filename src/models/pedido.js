const { DataTypes } = require("sequelize");
const sequelize = require("../db/sequelize");

const Pedido = sequelize.define(
  "Pedido",
  {
    idPedido: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    idConsumidor: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    estado: {
      type: DataTypes.ENUM(
        "PENDIENTE",
        "CONFIRMADO",
        "EN_PREPARACION",
        "LISTO",
        "ENTREGADO",
        "CANCELADO"
      ),
      allowNull: false,
      defaultValue: "PENDIENTE",
    },
    tipoEntrega: {
      type: DataTypes.ENUM("RECOGIDA_FINCA", "DOMICILIO"),
      allowNull: false,
    },
    costoEnvio: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
  },
  {
    tableName: "pedidos",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Pedido;

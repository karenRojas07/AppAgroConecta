const { DataTypes } = require("sequelize");
const sequelize = require("../db/sequelize");

const Resena = sequelize.define(
  "Resena",
  {
    idResena: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    idPedido: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    idConsumidor: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    idProductor: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    calificacion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comentario: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "resenas",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Resena;

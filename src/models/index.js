const sequelize = require("../db/sequelize");
const Usuario = require("./usuario");
const Productor = require("./productor");
const Consumidor = require("./consumidor");
const Producto = require("./producto");
const Pedido = require("./pedido");
const DetallePedido = require("./detallePedido");
const Resena = require("./resena");

Usuario.hasOne(Productor, {
  foreignKey: "idUsuario",
  sourceKey: "idUsuario",
  as: "productor",
});
Productor.belongsTo(Usuario, {
  foreignKey: "idUsuario",
  targetKey: "idUsuario",
  as: "usuario",
});

Usuario.hasOne(Consumidor, {
  foreignKey: "idUsuario",
  sourceKey: "idUsuario",
  as: "consumidor",
});
Consumidor.belongsTo(Usuario, {
  foreignKey: "idUsuario",
  targetKey: "idUsuario",
  as: "usuario",
});

Productor.hasMany(Producto, {
  foreignKey: "idProductor",
  sourceKey: "idUsuario",
  as: "productos",
});
Producto.belongsTo(Productor, {
  foreignKey: "idProductor",
  targetKey: "idUsuario",
  as: "productor",
});

Consumidor.hasMany(Pedido, {
  foreignKey: "idConsumidor",
  sourceKey: "idUsuario",
  as: "pedidos",
});
Pedido.belongsTo(Consumidor, {
  foreignKey: "idConsumidor",
  targetKey: "idUsuario",
  as: "consumidor",
});

Pedido.hasMany(DetallePedido, {
  foreignKey: "idPedido",
  sourceKey: "idPedido",
  as: "detalles",
  onDelete: "CASCADE",
});
DetallePedido.belongsTo(Pedido, {
  foreignKey: "idPedido",
  targetKey: "idPedido",
  as: "pedido",
});

Producto.hasMany(DetallePedido, {
  foreignKey: "idProducto",
  sourceKey: "idProducto",
  as: "detalles",
});
DetallePedido.belongsTo(Producto, {
  foreignKey: "idProducto",
  targetKey: "idProducto",
  as: "producto",
});

Consumidor.hasMany(Resena, {
  foreignKey: "idConsumidor",
  sourceKey: "idUsuario",
  as: "resenas",
});
Resena.belongsTo(Consumidor, {
  foreignKey: "idConsumidor",
  targetKey: "idUsuario",
  as: "consumidor",
});

Productor.hasMany(Resena, {
  foreignKey: "idProductor",
  sourceKey: "idUsuario",
  as: "resenasRecibidas",
});
Resena.belongsTo(Productor, {
  foreignKey: "idProductor",
  targetKey: "idUsuario",
  as: "productor",
});

Pedido.hasOne(Resena, {
  foreignKey: "idPedido",
  sourceKey: "idPedido",
  as: "resena",
});
Resena.belongsTo(Pedido, {
  foreignKey: "idPedido",
  targetKey: "idPedido",
  as: "pedido",
});

module.exports = {
  sequelize,
  Usuario,
  Productor,
  Consumidor,
  Producto,
  Pedido,
  DetallePedido,
  Resena,
};

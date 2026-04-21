const { Sequelize } = require("sequelize");
const env = require("../config/env");

const sequelize = new Sequelize(env.dbName, env.dbUser, env.dbPassword, {
  host: env.dbHost,
  port: env.dbPort,
  dialect: "mysql",
  logging: env.nodeEnv === "development" ? console.log : false,
  define: {
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  },
});

module.exports = sequelize;

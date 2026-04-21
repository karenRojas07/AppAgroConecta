const app = require("./app");
const env = require("./config/env");
const { sequelize } = require("./models");

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({
      alter: env.dbSyncAlter,
      force: env.dbSyncForce,
    });

    app.listen(env.port, () => {
      console.log(`AgroConecta API corriendo en puerto ${env.port}`);
    });
  } catch (error) {
    console.error("No fue posible iniciar el servidor:", error);
    process.exit(1);
  }
};

start();

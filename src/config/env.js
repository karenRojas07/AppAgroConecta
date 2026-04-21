const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const parseBoolean = (value, defaultValue = false) => {
  if (typeof value === "undefined") return defaultValue;
  return String(value).toLowerCase() === "true";
};

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3000),
  dbHost: process.env.DB_HOST || "localhost",
  dbPort: Number(process.env.DB_PORT || 3306),
  dbName: process.env.DB_NAME || "AgroConectaProyectoFinal",
  dbUser: process.env.DB_USER || "root",
  dbPassword: process.env.DB_PASSWORD || "root",
  dbSyncAlter: parseBoolean(process.env.DB_SYNC_ALTER, true),
  dbSyncForce: parseBoolean(process.env.DB_SYNC_FORCE, false),
  jwtSecret: process.env.JWT_SECRET || "agroconecta_dev_secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "12h",
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 200),
};

module.exports = env;

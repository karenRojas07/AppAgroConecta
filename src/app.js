const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const env = require("./config/env");
const apiRoutes = require("./routes");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.use(
  helmet({
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin",
    },
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": ["'self'", "https://unpkg.com"],
        "style-src": ["'self'", "https:", "'unsafe-inline'"],
        "connect-src": [
          "'self'",
          "https://unpkg.com",
          "https://tile.openstreetmap.org",
          "https://*.tile.openstreetmap.org",
        ],
        "img-src": [
          "'self'",
          "data:",
          "https://tile.openstreetmap.org",
          "https://*.tile.openstreetmap.org",
          "https://unpkg.com",
        ],
        "font-src": ["'self'", "https:", "data:"],
      },
    },
  })
);

app.get("/.well-known/appspecific/com.chrome.devtools.json", (req, res) => {
  res.status(204).end();
});

app.use(
  rateLimit({
    windowMs: env.rateLimitWindowMs,
    limit: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));
app.use(express.static(path.resolve(__dirname, "..", "public")));

app.use("/api/v1", apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

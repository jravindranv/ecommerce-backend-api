"use strict";

const express = require("express");
const { HttpError } = require("./errors");
const requestLogger = require("./middleware/requestLogger");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");

/**
 * Builds the Express application around an already opened database.
 * Keeping this separate from server.js lets the tests start the app
 * on a random port with an in-memory database.
 */
function createApp(db, { logRequests = true } = {}) {
  const app = express();

  app.use(express.json({ limit: "100kb" }));
  if (logRequests) app.use(requestLogger);

  app.get("/api/health", (req, res) => {
    db.prepare("SELECT 1").get(); // proves the database is reachable
    res.json({
      status: "ok",
      service: "ecommerce-backend-api",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/products", productRoutes(db));
  app.use("/api/orders", orderRoutes(db));

  // unknown route -> 404
  app.use((req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
  });

  // central error handler (must have 4 parameters)
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof HttpError) {
      const body = { error: err.message };
      if (err.details) body.details = err.details;
      return res.status(err.status).json(body);
    }
    if (err.type === "entity.parse.failed") {
      return res.status(400).json({ error: "Malformed JSON in request body" });
    }
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  });

  return app;
}

module.exports = { createApp };

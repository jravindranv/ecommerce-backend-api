"use strict";

const { openDatabase } = require("./db");
const { createApp } = require("./app");

const PORT = Number(process.env.PORT) || 3000;
const DB_FILE = process.env.DB_FILE || "store.db";

const db = openDatabase(DB_FILE);
const app = createApp(db);

const server = app.listen(PORT, () => {
  console.log("E-Commerce Backend API");
  console.log(`Database : ${DB_FILE}`);
  console.log(`Listening: http://localhost:${PORT}`);
  console.log(`Health   : http://localhost:${PORT}/api/health`);
});

function shutdown() {
  console.log("\nShutting down...");
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

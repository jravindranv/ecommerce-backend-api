"use strict";

const { openDatabase } = require("./db");

const db = openDatabase(process.env.DB_FILE || "store.db");

const count = db.prepare("SELECT COUNT(*) AS n FROM products").get().n;
if (count > 0) {
  console.log(`Seed skipped: products table already has ${count} row(s).`);
} else {
  const insert = db.prepare(
    "INSERT INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)"
  );
  const sample = [
    ["Wireless Mouse", "2.4 GHz wireless mouse", 599, 25],
    ["USB Keyboard", "Full-size wired keyboard", 799, 12],
    ["USB-C Hub", "6-in-1 USB-C hub", 1499, 0],
    ["Laptop Stand", "Adjustable aluminium stand", 1299, 18],
    ["Webcam", "1080p webcam with microphone", 2499, 8],
  ];
  db.transaction(() => sample.forEach((row) => insert.run(...row)))();
  console.log(`Seeded ${sample.length} products.`);
}
db.close();

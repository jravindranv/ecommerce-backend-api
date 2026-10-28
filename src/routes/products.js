"use strict";

const express = require("express");
const { HttpError } = require("../errors");
const { validateProduct, parseId } = require("../validators");

/** Converts a database row into the public JSON representation. */
const toApi = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  price: row.price,
  stock: row.stock,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

function productRoutes(db) {
  const router = express.Router();

  const findById = db.prepare("SELECT * FROM products WHERE id = ?");

  function requireId(req) {
    const id = parseId(req.params.id);
    if (id === null) throw new HttpError(400, "id must be a positive integer");
    return id;
  }

  // GET /api/products?q=mouse&limit=20&offset=0
  router.get("/", (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const like = `%${q}%`;

    const total = db
      .prepare("SELECT COUNT(*) AS n FROM products WHERE name LIKE ?")
      .get(like).n;
    const rows = db
      .prepare("SELECT * FROM products WHERE name LIKE ? ORDER BY id LIMIT ? OFFSET ?")
      .all(like, limit, offset);

    res.set("X-Total-Count", String(total));
    res.json(rows.map(toApi));
  });

  // GET /api/products/:id
  router.get("/:id", (req, res) => {
    const row = findById.get(requireId(req));
    if (!row) throw new HttpError(404, "Product not found");
    res.json(toApi(row));
  });

  // POST /api/products
  router.post("/", (req, res) => {
    const { errors, value } = validateProduct(req.body);
    if (errors.length) throw new HttpError(400, "Validation failed", errors);

    const info = db
      .prepare("INSERT INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)")
      .run(value.name, value.description, value.price, value.stock);

    res.status(201).json(toApi(findById.get(info.lastInsertRowid)));
  });

  // PUT /api/products/:id
  router.put("/:id", (req, res) => {
    const id = requireId(req);
    if (!findById.get(id)) throw new HttpError(404, "Product not found");

    const { errors, value } = validateProduct(req.body);
    if (errors.length) throw new HttpError(400, "Validation failed", errors);

    db.prepare(
      `UPDATE products
          SET name = ?, description = ?, price = ?, stock = ?,
              updated_at = datetime('now')
        WHERE id = ?`
    ).run(value.name, value.description, value.price, value.stock, id);

    res.json(toApi(findById.get(id)));
  });

  // DELETE /api/products/:id
  router.delete("/:id", (req, res) => {
    const id = requireId(req);
    if (!findById.get(id)) throw new HttpError(404, "Product not found");

    const used = db.prepare("SELECT 1 FROM order_items WHERE product_id = ? LIMIT 1").get(id);
    if (used) {
      throw new HttpError(409, "Product is part of an existing order and cannot be deleted");
    }

    db.prepare("DELETE FROM products WHERE id = ?").run(id);
    res.json({ message: "Product deleted", id });
  });

  return router;
}

module.exports = productRoutes;

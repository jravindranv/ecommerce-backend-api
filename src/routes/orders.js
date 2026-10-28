"use strict";

const express = require("express");
const { HttpError } = require("../errors");
const { validateOrder, parseId } = require("../validators");

const round2 = (n) => Math.round(n * 100) / 100;

function orderRoutes(db) {
  const router = express.Router();

  const getProduct = db.prepare("SELECT id, name, price, stock FROM products WHERE id = ?");
  const insertOrder = db.prepare(
    "INSERT INTO orders (customer_name, customer_email, total) VALUES (?, ?, ?)"
  );
  const insertItem = db.prepare(
    "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)"
  );
  const reduceStock = db.prepare(
    "UPDATE products SET stock = stock - ?, updated_at = datetime('now') WHERE id = ? AND stock >= ?"
  );

  /** Reads an order together with its line items. */
  function loadOrder(id) {
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    if (!order) return null;

    const items = db
      .prepare(
        `SELECT oi.product_id, p.name, oi.quantity, oi.unit_price
           FROM order_items oi
           JOIN products p ON p.id = oi.product_id
          WHERE oi.order_id = ?
          ORDER BY oi.id`
      )
      .all(id)
      .map((i) => ({
        productId: i.product_id,
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        lineTotal: round2(i.quantity * i.unit_price),
      }));

    return {
      id: order.id,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      status: order.status,
      total: order.total,
      createdAt: order.created_at,
      items,
    };
  }

  /**
   * The whole order is written inside ONE transaction: either the order,
   * its items and the stock reduction are all saved, or nothing is.
   */
  const placeOrder = db.transaction((customerName, customerEmail, items) => {
    // 1. merge duplicate product ids  (e.g. two lines for product 1)
    const wanted = new Map();
    for (const { productId, quantity } of items) {
      wanted.set(productId, (wanted.get(productId) || 0) + quantity);
    }

    // 2. check that every product exists and has enough stock
    const lines = [];
    for (const [productId, quantity] of wanted) {
      const product = getProduct.get(productId);
      if (!product) throw new HttpError(404, `Product ${productId} not found`);
      if (product.stock < quantity) {
        throw new HttpError(
          400,
          `Insufficient stock for "${product.name}": requested ${quantity}, available ${product.stock}`
        );
      }
      lines.push({ product, quantity });
    }

    // 3. total is calculated on the server from the STORED prices
    const total = round2(lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0));

    // 4. save order + items and reduce stock
    const orderId = insertOrder.run(customerName, customerEmail, total).lastInsertRowid;
    for (const { product, quantity } of lines) {
      insertItem.run(orderId, product.id, quantity, product.price);
      const result = reduceStock.run(quantity, product.id, quantity);
      if (result.changes !== 1) {
        throw new HttpError(400, `Insufficient stock for "${product.name}"`);
      }
    }
    return Number(orderId);
  });

  // POST /api/orders
  router.post("/", (req, res) => {
    const { errors, value } = validateOrder(req.body);
    if (errors.length) throw new HttpError(400, "Validation failed", errors);

    const orderId = placeOrder(value.customerName, value.customerEmail, value.items);
    res.status(201).json({ message: "Order created successfully", order: loadOrder(orderId) });
  });

  // GET /api/orders
  router.get("/", (req, res) => {
    const rows = db
      .prepare("SELECT id, customer_name, status, total, created_at FROM orders ORDER BY id DESC")
      .all();
    res.json(
      rows.map((o) => ({
        id: o.id,
        customerName: o.customer_name,
        status: o.status,
        total: o.total,
        createdAt: o.created_at,
      }))
    );
  });

  // GET /api/orders/:id
  router.get("/:id", (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) throw new HttpError(400, "id must be a positive integer");
    const order = loadOrder(id);
    if (!order) throw new HttpError(404, "Order not found");
    res.json(order);
  });

  return router;
}

module.exports = orderRoutes;

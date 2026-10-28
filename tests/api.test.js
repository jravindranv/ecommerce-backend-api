"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { openDatabase } = require("../src/db");
const { createApp } = require("../src/app");

let server, base, db;

test.before(async () => {
  db = openDatabase(":memory:");
  const app = createApp(db, { logRequests: false });
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => { server.close(); db.close(); });

async function call(method, path, body, rawBody) {
  const res = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: rawBody !== undefined ? rawBody : body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* empty body */ }
  return { status: res.status, body: json };
}

const mouse = { name: "Wireless Mouse", description: "2.4 GHz wireless mouse", price: 599, stock: 25 };

test("TC-01 health endpoint returns 200 and status ok", async () => {
  const r = await call("GET", "/api/health");
  assert.equal(r.status, 200);
  assert.equal(r.body.status, "ok");
});

test("TC-02 listing products on an empty store returns 200 and []", async () => {
  const r = await call("GET", "/api/products");
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, []);
});

test("TC-03 requesting a missing product returns 404", async () => {
  const r = await call("GET", "/api/products/999");
  assert.equal(r.status, 404);
});

test("TC-04 valid product creation returns 201", async () => {
  const r = await call("POST", "/api/products", mouse);
  assert.equal(r.status, 201);
  assert.equal(r.body.id, 1);
  assert.equal(r.body.price, 599);
});

test("TC-05 negative price is rejected with 400", async () => {
  const r = await call("POST", "/api/products", { ...mouse, price: -5 });
  assert.equal(r.status, 400);
  assert.ok(r.body.details.includes("price must not be negative"));
});

test("TC-06 valid order returns 201 and server-calculated total", async () => {
  const r = await call("POST", "/api/orders", {
    customerName: "Sample Customer",
    customerEmail: "customer@example.com",
    items: [{ productId: 1, quantity: 2 }],
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.order.total, 1198);
  assert.equal(r.body.order.status, "PLACED");
});

test("TC-07 insufficient stock returns 400 and changes nothing", async () => {
  const r = await call("POST", "/api/orders", {
    customerName: "Sample Customer",
    customerEmail: "customer@example.com",
    items: [{ productId: 1, quantity: 100 }],
  });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /Insufficient stock/);
  const p = await call("GET", "/api/products/1");
  assert.equal(p.body.stock, 23);
});

test("TC-08 unknown route returns 404", async () => {
  const r = await call("GET", "/api/unknown");
  assert.equal(r.status, 404);
});

test("TC-09 product update changes the stored values", async () => {
  const r = await call("PUT", "/api/products/1", { ...mouse, price: 649, stock: 30 });
  assert.equal(r.status, 200);
  assert.equal(r.body.price, 649);
  assert.equal(r.body.stock, 30);
});

test("TC-10 order for an unknown product returns 404", async () => {
  const r = await call("POST", "/api/orders", {
    customerName: "Sample Customer",
    customerEmail: "customer@example.com",
    items: [{ productId: 42, quantity: 1 }],
  });
  assert.equal(r.status, 404);
});

test("TC-11 order with missing fields returns 400 with details", async () => {
  const r = await call("POST", "/api/orders", { customerName: "" });
  assert.equal(r.status, 400);
  assert.ok(r.body.details.length >= 2);
});

test("TC-12 order details can be retrieved after creation", async () => {
  const r = await call("GET", "/api/orders/1");
  assert.equal(r.status, 200);
  assert.equal(r.body.items.length, 1);
  assert.equal(r.body.items[0].unitPrice, 599);
});

test("TC-13 duplicate lines for one product are merged", async () => {
  await call("POST", "/api/products", { name: "USB Keyboard", price: 799, stock: 12 });
  const r = await call("POST", "/api/orders", {
    customerName: "Second Customer",
    customerEmail: "second@example.com",
    items: [{ productId: 2, quantity: 1 }, { productId: 2, quantity: 2 }],
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.order.items.length, 1);
  assert.equal(r.body.order.items[0].quantity, 3);
  assert.equal(r.body.order.total, 2397);
});

test("TC-14 a failed multi-item order rolls back completely", async () => {
  const before = (await call("GET", "/api/products/1")).body.stock;
  const r = await call("POST", "/api/orders", {
    customerName: "Rollback Test",
    customerEmail: "rollback@example.com",
    items: [{ productId: 1, quantity: 1 }, { productId: 2, quantity: 500 }],
  });
  assert.equal(r.status, 400);
  const after = (await call("GET", "/api/products/1")).body.stock;
  assert.equal(after, before);
});

test("TC-15 a product used in an order cannot be deleted (409)", async () => {
  const r = await call("DELETE", "/api/products/1");
  assert.equal(r.status, 409);
});

test("TC-16 an unused product can be deleted", async () => {
  const created = await call("POST", "/api/products", { name: "Temp Item", price: 10, stock: 1 });
  const r = await call("DELETE", `/api/products/${created.body.id}`);
  assert.equal(r.status, 200);
  const again = await call("GET", `/api/products/${created.body.id}`);
  assert.equal(again.status, 404);
});

test("TC-17 malformed JSON returns 400", async () => {
  const r = await call("POST", "/api/products", null, "{ bad json");
  assert.equal(r.status, 400);
  assert.equal(r.body.error, "Malformed JSON in request body");
});

test("TC-18 non-numeric id returns 400", async () => {
  const r = await call("GET", "/api/products/abc");
  assert.equal(r.status, 400);
});

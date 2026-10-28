"use strict";
/**
 * Walks through the main API scenarios against a RUNNING server and prints
 * every request and response. Usage:  npm start   (terminal 1)
 *                                     npm run demo (terminal 2)
 */
const BASE = process.env.API_BASE || "http://localhost:3000";
let step = 0;

async function call(title, method, path, body) {
  step += 1;
  console.log(`\n=== Step ${step}: ${title}`);
  console.log(`> ${method} ${path}`);
  if (body) console.log(`> body: ${JSON.stringify(body)}`);
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  console.log(`< ${res.status} ${res.statusText}`);
  try { console.log(JSON.stringify(JSON.parse(text), null, 2)); } catch { console.log(text); }
}

(async () => {
  const customer = { customerName: "Anita Menon", customerEmail: "anita.menon@example.com" };

  await call("Health check", "GET", "/api/health");
  await call("List products (empty store)", "GET", "/api/products");
  await call("Create product 1", "POST", "/api/products",
    { name: "Wireless Mouse", description: "2.4 GHz wireless mouse", price: 599, stock: 25 });
  await call("Create product 2", "POST", "/api/products",
    { name: "USB Keyboard", description: "Full-size wired keyboard", price: 799, stock: 12 });
  await call("Create product 3 (out of stock)", "POST", "/api/products",
    { name: "USB-C Hub", description: "6-in-1 USB-C hub", price: 1499, stock: 0 });
  await call("List products", "GET", "/api/products");
  await call("Get product 1", "GET", "/api/products/1");
  await call("Search products (q=key)", "GET", "/api/products?q=key");
  await call("Get missing product", "GET", "/api/products/99");
  await call("Create product with negative price", "POST", "/api/products",
    { name: "Broken Item", price: -50, stock: 3 });
  await call("Update product 1 price", "PUT", "/api/products/1",
    { name: "Wireless Mouse", description: "2.4 GHz wireless mouse", price: 649, stock: 25 });
  await call("Place a valid order", "POST", "/api/orders",
    { ...customer, items: [{ productId: 1, quantity: 2 }, { productId: 2, quantity: 1 }] });
  await call("Order more than the available stock", "POST", "/api/orders",
    { ...customer, items: [{ productId: 2, quantity: 50 }] });
  await call("Order an out-of-stock product", "POST", "/api/orders",
    { ...customer, items: [{ productId: 3, quantity: 1 }] });
  await call("Order an unknown product", "POST", "/api/orders",
    { ...customer, items: [{ productId: 77, quantity: 1 }] });
  await call("Order with missing fields", "POST", "/api/orders", { customerName: "" });
  await call("Retrieve order 1", "GET", "/api/orders/1");
  await call("List all orders", "GET", "/api/orders");
  await call("List products after the order (stock reduced)", "GET", "/api/products");
  await call("Delete a product used in an order", "DELETE", "/api/products/1");
  await call("Create and delete a temporary product", "POST", "/api/products",
    { name: "Temp Item", price: 10, stock: 1 });
  await call("Delete product 4", "DELETE", "/api/products/4");
  await call("Unknown route", "GET", "/api/unknown");
})();

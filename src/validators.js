"use strict";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isPositiveInt = (v) => Number.isInteger(v) && v > 0;

/** Validates a product payload (used by POST and PUT). */
function validateProduct(body) {
  const errors = [];
  if (!isPlainObject(body)) {
    return { errors: ["request body must be a JSON object"], value: null };
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) errors.push("name is required");
  else if (name.length > 100) errors.push("name must be at most 100 characters");

  let description = "";
  if (body.description !== undefined) {
    if (typeof body.description !== "string") errors.push("description must be a string");
    else if (body.description.length > 500) errors.push("description must be at most 500 characters");
    else description = body.description.trim();
  }

  const { price } = body;
  if (typeof price !== "number" || !Number.isFinite(price)) errors.push("price must be a number");
  else if (price < 0) errors.push("price must not be negative");
  else if (price > 10000000) errors.push("price is unrealistically large");

  let stock = 0;
  if (body.stock !== undefined) {
    if (!Number.isInteger(body.stock)) errors.push("stock must be an integer");
    else if (body.stock < 0) errors.push("stock must not be negative");
    else stock = body.stock;
  }

  if (errors.length) return { errors, value: null };
  return { errors, value: { name, description, price: Math.round(price * 100) / 100, stock } };
}

/** Validates the payload of POST /api/orders. */
function validateOrder(body) {
  const errors = [];
  if (!isPlainObject(body)) {
    return { errors: ["request body must be a JSON object"], value: null };
  }

  const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
  if (customerName.length < 2) errors.push("customerName is required");
  else if (customerName.length > 100) errors.push("customerName must be at most 100 characters");

  const customerEmail = typeof body.customerEmail === "string" ? body.customerEmail.trim() : "";
  if (!EMAIL_PATTERN.test(customerEmail)) errors.push("customerEmail must be a valid email address");

  const items = [];
  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.push("items must be a non-empty array");
  } else if (body.items.length > 50) {
    errors.push("items must contain at most 50 entries");
  } else {
    body.items.forEach((item, i) => {
      if (!isPlainObject(item) || !isPositiveInt(item.productId)) {
        errors.push(`items[${i}].productId must be a positive integer`);
      } else if (!isPositiveInt(item.quantity) || item.quantity > 100) {
        errors.push(`items[${i}].quantity must be an integer between 1 and 100`);
      } else {
        items.push({ productId: item.productId, quantity: item.quantity });
      }
    });
  }

  if (errors.length) return { errors, value: null };
  return { errors, value: { customerName, customerEmail, items } };
}

/** Parses a route parameter such as :id into a positive integer. */
function parseId(raw) {
  return /^\d+$/.test(raw) && Number(raw) > 0 ? Number(raw) : null;
}

module.exports = { validateProduct, validateOrder, parseId };

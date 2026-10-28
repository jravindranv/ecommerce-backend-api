"use strict";

/**
 * HttpError carries an HTTP status code so that route handlers can simply
 * `throw` and let the central error handler build the JSON response.
 */
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}

module.exports = { HttpError };

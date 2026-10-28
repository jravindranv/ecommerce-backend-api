"use strict";

/** Prints one line per request: time, method, url, status and duration. */
function requestLogger(req, res, next) {
  const started = process.hrtime.bigint();
  res.on("finish", () => {
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    const time = new Date().toISOString().slice(11, 19);
    console.log(
      `[${time}] ${req.method.padEnd(6)} ${req.originalUrl || req.url}  ${res.statusCode}  ${ms.toFixed(1)} ms`
    );
  });
  next();
}

module.exports = requestLogger;

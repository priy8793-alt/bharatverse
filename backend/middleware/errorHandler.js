const multer = require("multer");

function notFound(req, res, next) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error("[error]", err.message);
  if (process.env.NODE_ENV !== "production") {
    console.error(err.stack);
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({ error: "Validation failed", details: err.errors });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ error: `Invalid identifier: ${err.value}` });
  }

  if (err.code === 11000) {
    return res.status(409).json({ error: "Duplicate value", details: err.keyValue });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.publicMessage || "Something went wrong on the server.",
  });
}

module.exports = { notFound, errorHandler };

// Global error handling middleware
// Catches any error passed via next(err) from controllers

const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", err.message || err);

  const status  = err.status  || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ error: message });
};

module.exports = errorHandler;
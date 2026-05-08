/**
 * Global error handler.
 * Services throw { status, message } for known errors.
 * Everything else is treated as a 500.
 */
const errorHandler = (err, req, res, next) => {
  // Known application error (thrown manually in services)
  if (err.status && err.message) {
    return res.status(err.status).json({ error: err.message });
  }

  // Prisma unique constraint violation (P2002)
  if (err.code === "P2002") {
    const field = err.meta?.target?.join(", ") || "field";
    return res.status(409).json({ error: `A record with this ${field} already exists.` });
  }

  // Prisma record not found (P2025)
  if (err.code === "P2025") {
    return res.status(404).json({ error: "Record not found." });
  }

  // Unknown / unexpected errors
  console.error("Unhandled error:", err);
  return res.status(500).json({ error: "An unexpected error occurred. Please try again." });
};

module.exports = errorHandler;
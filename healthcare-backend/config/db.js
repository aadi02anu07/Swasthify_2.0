const { PrismaClient } = require("@prisma/client");

// In development, hot-reload (nodemon) can create multiple PrismaClient instances
// and exhaust the connection pool. This singleton pattern prevents that.
const globalForPrisma = global;

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
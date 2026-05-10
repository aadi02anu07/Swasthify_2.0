require("dotenv").config();
const express      = require("express");
const http         = require("http");
const cors         = require("cors");
const rateLimit    = require("express-rate-limit");

const prisma        = require("./config/db");
const setupSocket   = require("./socket");
const authRoutes    = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const aiRoutes           = require("./routes/aiRoutes");
const appointmentRoutes  = require("./routes/appointmentRoutes");
const reportRoutes       = require("./routes/reportRoutes");
const errorHandler  = require("./middleware/errorHandler");

const app    = express();
const server = http.createServer(app);

// ── Socket.IO ─────────────────────────────────────────────────────────────────
// Auth, room management, and event handling all live in ./socket/index.js
const io = setupSocket(server);
app.set("io", io); // controllers access via req.app.get("io")

// ── Core Middleware ───────────────────────────────────────────────────────────
app.use(express.json());
app.use(cors({
  origin:      process.env.FRONTEND_URL || "*",
  credentials: true,
}));

// Global rate limiter — 100 req / 15 min per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  message:  { error: "Too many requests, please try again later." },
}));

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message:  { error: "Too many auth attempts, please try again later." },
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",     authLimiter, authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/ai",           aiRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/reports",      reportRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) =>
  res.status(200).json({ status: "ok", version: "2.0.0", message: "Swasthify API" })
);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: "Route not found." }));

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log(`\n🚀 Swasthify API v3 running on port ${PORT}`);
  
  // Retry DB connection up to 5 times (Neon free tier sleeps and needs a wake-up)
  let retries = 5;
  while (retries > 0) {
    try {
      await prisma.$connect();
      console.log("✅ PostgreSQL connected via Prisma");
      break;
    } catch (err) {
      retries--;
      if (retries === 0) {
        console.error("❌ DB connection failed after 5 attempts:", err.message);
        // Don't exit — server still runs, DB will connect on first request
      } else {
        console.log(`⏳ DB not ready, retrying in 3s... (${retries} attempts left)`);
        await new Promise(res => setTimeout(res, 3000));
      }
    }
  }
});
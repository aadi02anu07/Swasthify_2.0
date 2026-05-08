require("dotenv").config();
const express    = require("express");
const http       = require("http");
const { Server } = require("socket.io");
const cors       = require("cors");
const rateLimit  = require("express-rate-limit");

const prisma       = require("./config/db");
const { redis }    = require("./config/redis");
const authRoutes   = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const errorHandler = require("./middleware/errorHandler");

const app    = express();
const server = http.createServer(app);  // wrap express in http.Server for Socket.IO

// ── Socket.IO ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
  },
});

// Attach io to app so controllers can emit events via req.app.get("io")
app.set("io", io);

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Staff/patient joins a room to watch a specific patient's live vitals
  socket.on("join:patient", (patientID) => {
    socket.join(`patient:${patientID}`);
    console.log(`   ↳ joined room patient:${patientID}`);
  });

  socket.on("leave:patient", (patientID) => {
    socket.leave(`patient:${patientID}`);
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ── Core Middleware ───────────────────────────────────────────────────────────
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
}));

// Global rate limiter — 100 requests per 15 min per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
});
app.use(globalLimiter);

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many auth attempts, please try again later." },
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",     authLimiter, authRoutes);
app.use("/api/patients", patientRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.status(200).send("🚀 Swasthify API v3 is running!"));

// ── 404 ────────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log(`✅ Server running on port ${PORT}`);
  // Verify DB connection on startup
  try {
    await prisma.$connect();
    console.log("✅ PostgreSQL connected via Prisma");
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  }
});
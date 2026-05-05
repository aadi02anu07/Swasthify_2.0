require("dotenv").config();
const express = require("express");
const cors    = require("cors");

const connectDB     = require("./db/db");
const authRoutes    = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const errorHandler  = require("./middleware/errorHandler");

const app = express();

// ── Core Middleware ──────────────────────────────────────────────────────────
app.use(express.json());
app.use(cors({ origin: "*" }));

// ── Database ─────────────────────────────────────────────────────────────────
connectDB();

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",     authRoutes);
app.use("/api/patients", patientRoutes);

// ── Health Check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.status(200).send("🚀 Swasthify API is running!"));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// ── Global Error Handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
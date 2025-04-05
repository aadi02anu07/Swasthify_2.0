require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: "*" })); // ✅ Allow all origins for now

// ✅ Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  });

// ✅ Define Routes
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);

// ✅ Test API Route
app.get("/", (req, res) => {
  res.status(200).send("🚀 API is working on Railway!");
});

// ✅ 404 Handler for Undefined Routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ✅ Start Server (Use Railway’s PORT)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

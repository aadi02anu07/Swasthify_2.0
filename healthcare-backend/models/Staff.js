const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
  staffID: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, enum: ["doctor", "nurse"], required: true },
  password: { type: String, required: true } // Hashed password
});

module.exports = mongoose.model("Staff", staffSchema);

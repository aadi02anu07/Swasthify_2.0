const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  bp: { type: String, required: true },
  sugar: { type: String, required: true },
  heartRate: { type: String, required: true },
  patientID: { type: String, unique: true, required: true },
  password: { type: String}
});

const Patient = mongoose.model("Patient", patientSchema);

module.exports = Patient;

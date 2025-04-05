const express = require("express");
const Patient = require("../models/Patient");
const router = express.Router();

// ✅ API 1: Add a New Patient
router.post("/add", async (req, res) => {
  try {
    console.log("🟢 Received Data at Backend:", req.body); // 🔍 Debugging log

    const { patientID, name, age, bp, sugar, heartRate } = req.body;

    if (!heartRate) {
      console.log("❌ Error: Heart Rate is missing!");
      return res.status(400).json({ error: "Heart Rate is required" });
    }

    const newPatient = new Patient({ patientID, name, age, bp, sugar, heartRate });
    await newPatient.save();

    console.log("✅ Patient Registered Successfully:", newPatient);
    res.json({ message: "Patient added successfully!", patient: newPatient });
  } catch (error) {
    console.error("❌ Error Registering Patient:", error);
    res.status(500).json({ error: error.message });
  }
});


// ✅ API 2: Get All Patients
router.get("/", async (req, res) => {
  try {
    const patients = await Patient.find(); // 🔍 Fetch all fields including heartRate
    console.log("🟢 Fetched Patients:", patients); // Debugging log
    res.json(patients);
  } catch (error) {
    console.error("❌ Error Fetching Patients:", error);
    res.status(500).json({ error: error.message });
  }
});


// ✅ API 3: Get a Single Patient by ID
router.get("/:patientID", async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientID: req.params.patientID }, "patientID name age bp sugar heartRate");
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ API 4: Update Patient Vitals
router.put("/update/:patientID", async (req, res) => {
  try {
    const { bp, sugar, heartRate } = req.body;
    const updatedPatient = await Patient.findOneAndUpdate(
      { patientID: req.params.patientID },
      { bp, sugar, heartRate, lastUpdated: Date.now() },
      { new: true }
    );
    if (!updatedPatient) return res.status(404).json({ message: "Patient not found" });
    res.json({ message: "Patient updated successfully!", updatedPatient });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ API 5: Delete a Patient
router.delete("/delete/:patientID", async (req, res) => {
  try {
    const deletedPatient = await Patient.findOneAndDelete({ patientID: req.params.patientID });
    if (!deletedPatient) return res.status(404).json({ message: "Patient not found" });
    res.json({ message: "Patient deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
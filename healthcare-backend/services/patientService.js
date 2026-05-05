const Patient = require("../db/models/Patient");

const addPatient = async ({ patientID, name, age, bp, sugar, heartRate }) => {
  if (!heartRate) {
    throw { status: 400, message: "Heart Rate is required" };
  }

  const patient = new Patient({ patientID, name, age, bp, sugar, heartRate });
  await patient.save();

  return { message: "Patient added successfully!", patient };
};

const getAllPatients = async () => {
  return await Patient.find();
};

const getPatientByID = async (patientID) => {
  const patient = await Patient.findOne(
    { patientID },
    "patientID name age bp sugar heartRate"
  );
  if (!patient) {
    throw { status: 404, message: "Patient not found" };
  }
  return patient;
};

const updatePatientVitals = async (patientID, { bp, sugar, heartRate }) => {
  const updated = await Patient.findOneAndUpdate(
    { patientID },
    { bp, sugar, heartRate, lastUpdated: Date.now() },
    { new: true }
  );
  if (!updated) {
    throw { status: 404, message: "Patient not found" };
  }
  return { message: "Patient updated successfully!", updatedPatient: updated };
};

const deletePatient = async (patientID) => {
  const deleted = await Patient.findOneAndDelete({ patientID });
  if (!deleted) {
    throw { status: 404, message: "Patient not found" };
  }
  return { message: "Patient deleted successfully!" };
};

module.exports = {
  addPatient,
  getAllPatients,
  getPatientByID,
  updatePatientVitals,
  deletePatient,
};
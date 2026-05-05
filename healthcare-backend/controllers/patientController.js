const patientService = require("../services/patientService");

const addPatient = async (req, res, next) => {
  try {
    const result = await patientService.addPatient(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const getAllPatients = async (req, res, next) => {
  try {
    const patients = await patientService.getAllPatients();
    res.status(200).json(patients);
  } catch (err) {
    next(err);
  }
};

const getPatient = async (req, res, next) => {
  try {
    const patient = await patientService.getPatientByID(req.params.patientID);
    res.status(200).json(patient);
  } catch (err) {
    next(err);
  }
};

const updatePatient = async (req, res, next) => {
  try {
    const result = await patientService.updatePatientVitals(req.params.patientID, req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const deletePatient = async (req, res, next) => {
  try {
    const result = await patientService.deletePatient(req.params.patientID);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { addPatient, getAllPatients, getPatient, updatePatient, deletePatient };
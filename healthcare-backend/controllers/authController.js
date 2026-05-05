const authService = require("../services/authService");

const staffSignup = async (req, res, next) => {
  try {
    const result = await authService.registerStaff(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const staffLogin = async (req, res, next) => {
  try {
    const result = await authService.loginStaff(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const patientSignup = async (req, res, next) => {
  try {
    const result = await authService.registerPatient(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const patientLogin = async (req, res, next) => {
  try {
    const result = await authService.loginPatient(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { staffSignup, staffLogin, patientSignup, patientLogin };
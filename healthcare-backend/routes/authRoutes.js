const express = require("express");
const router  = express.Router();

const ctrl = require("../controllers/authController");
const { validate } = require("../middleware/validate");
const { verifyToken } = require("../middleware/authMiddleware");
const {
  registerHospitalRules, loginHospitalRules,
  registerStaffRules,    loginStaffRules,
  registerPatientRules,  loginPatientRules,
} = require("../middleware/validators/authValidators");

// ── Hospital ──────────────────────────────────────────────────────────────────
router.post("/hospital/register", registerHospitalRules, validate, ctrl.registerHospital);
router.post("/hospital/login",    loginHospitalRules,    validate, ctrl.loginHospital);

// ── Staff ─────────────────────────────────────────────────────────────────────
router.post("/staff/register", registerStaffRules, validate, ctrl.registerStaff);
router.post("/staff/login",    loginStaffRules,    validate, ctrl.loginStaff);

// ── Patient ───────────────────────────────────────────────────────────────────
router.post("/patient/register", registerPatientRules, validate, ctrl.registerPatient);
router.post("/patient/login",    loginPatientRules,    validate, ctrl.loginPatient);

// ── Token Management ──────────────────────────────────────────────────────────
router.post("/refresh", ctrl.refreshToken);
router.post("/logout",  verifyToken, ctrl.logout);  // must be logged in to log out

module.exports = router;
const express = require("express");
const router  = express.Router();

const ctrl = require("../controllers/authController");
const validate  = require("../middleware/validate");
const { verifyToken, hospitalAdminOnly } = require("../middleware/authMiddleware");
const {
  registerHospitalRules, loginHospitalRules,
  registerStaffRules,    loginStaffRules,
  registerPatientRules,  loginPatientRules,
} = require("../middleware/validators/authValidators");

// ── Hospital ──────────────────────────────────────────────────────────────────
router.post("/hospital/register", registerHospitalRules, validate, ctrl.registerHospital);
router.post("/hospital/login",    loginHospitalRules,    validate, ctrl.loginHospital);
// Rotate registration code — hospital admin only, invalidates the old code immediately
router.post("/hospital/rotate-code", verifyToken, hospitalAdminOnly, ctrl.rotateRegistrationCode);

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
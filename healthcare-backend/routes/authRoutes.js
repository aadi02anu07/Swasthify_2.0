const express = require("express");
const router  = express.Router();

const { staffSignup, staffLogin, patientSignup, patientLogin } = require("../controllers/authController");
const { staffSignupRules, staffLoginRules, patientSignupRules, patientLoginRules } = require("../middleware/validators/authValidators");
const validate = require("../middleware/validate");

router.post("/staff/signup",  staffSignupRules,   validate, staffSignup);
router.post("/staff/login",   staffLoginRules,    validate, staffLogin);
router.post("/signup",        patientSignupRules, validate, patientSignup);
router.post("/patient/login", patientLoginRules,  validate, patientLogin);

module.exports = router;
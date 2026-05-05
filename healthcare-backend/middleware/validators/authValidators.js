const { body } = require("express-validator");

const staffSignupRules = [
  body("staffID")
    .trim()
    .notEmpty().withMessage("Staff ID is required"),
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required"),
  body("role")
    .isIn(["doctor", "nurse"]).withMessage("Role must be 'doctor' or 'nurse'"),
  body("password")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

const staffLoginRules = [
  body("staffID")
    .trim()
    .notEmpty().withMessage("Staff ID is required"),
  body("password")
    .notEmpty().withMessage("Password is required"),
];

const patientSignupRules = [
  body("patientID")
    .trim()
    .notEmpty().withMessage("Patient ID is required"),
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required"),
  body("age")
    .isInt({ min: 0, max: 150 }).withMessage("Age must be a number between 0 and 150"),
  body("bp")
    .trim()
    .notEmpty().withMessage("Blood pressure is required"),
  body("sugar")
    .trim()
    .notEmpty().withMessage("Sugar level is required"),
  body("heartRate")
    .trim()
    .notEmpty().withMessage("Heart rate is required"),
  body("password")
    .isLength({ min: 4 }).withMessage("Password must be at least 4 characters"),
];

const patientLoginRules = [
  body("patientID")
    .trim()
    .notEmpty().withMessage("Patient ID is required"),
  body("password")
    .notEmpty().withMessage("Password is required"),
];

module.exports = {
  staffSignupRules,
  staffLoginRules,
  patientSignupRules,
  patientLoginRules,
};
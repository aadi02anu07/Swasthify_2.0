const { body, param } = require("express-validator");

const addPatientRules = [
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
];

const updatePatientRules = [
  param("patientID")
    .trim()
    .notEmpty().withMessage("Patient ID param is required"),
  body("bp")
    .optional()
    .trim()
    .notEmpty().withMessage("Blood pressure cannot be blank if provided"),
  body("sugar")
    .optional()
    .trim()
    .notEmpty().withMessage("Sugar level cannot be blank if provided"),
  body("heartRate")
    .optional()
    .trim()
    .notEmpty().withMessage("Heart rate cannot be blank if provided"),
];

const patientIDParamRules = [
  param("patientID")
    .trim()
    .notEmpty().withMessage("Patient ID param is required"),
];

module.exports = { addPatientRules, updatePatientRules, patientIDParamRules };
const { body, query } = require("express-validator");

const recordVitalsRules = [
  body("bpSystolic")
    .isInt({ min: 50, max: 250 })
    .withMessage("Systolic BP must be between 50 and 250 mmHg."),
  body("bpDiastolic")
    .isInt({ min: 30, max: 150 })
    .withMessage("Diastolic BP must be between 30 and 150 mmHg."),
  body("heartRate")
    .isInt({ min: 20, max: 300 })
    .withMessage("Heart rate must be between 20 and 300 bpm."),
  body("sugar")
    .isFloat({ min: 10, max: 600 })
    .withMessage("Blood sugar must be between 10 and 600 mg/dL."),
  body("weight")
    .optional()
    .isFloat({ min: 1, max: 500 })
    .withMessage("Weight must be between 1 and 500 kg."),
  body("spo2")
    .optional()
    .isFloat({ min: 50, max: 100 })
    .withMessage("SpO₂ must be between 50 and 100%."),
  body("temperature")
    .optional()
    .isFloat({ min: 30, max: 45 })
    .withMessage("Temperature must be between 30 and 45°C."),
  body("notes")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Notes must be 500 characters or fewer."),
];

const historyQueryRules = [
  query("from")
    .optional()
    .isISO8601()
    .withMessage("'from' must be a valid ISO date (e.g. 2024-01-01)."),
  query("to")
    .optional()
    .isISO8601()
    .withMessage("'to' must be a valid ISO date."),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage("Limit must be between 1 and 500."),
];

module.exports = { recordVitalsRules, historyQueryRules };
const { body, query, param } = require("express-validator");

const VALID_TYPES = ["diagnosis", "surgery", "allergy", "medication", "lab_result", "vaccination", "imaging"];
const VALID_SEVERITIES = ["mild", "moderate", "severe"];

const addMedicalRecordRules = [
  body("title")
    .trim()
    .notEmpty().withMessage("Title is required.")
    .isLength({ max: 200 }).withMessage("Title must be 200 characters or fewer."),

  body("description")
    .trim()
    .notEmpty().withMessage("Description is required.")
    .isLength({ max: 2000 }).withMessage("Description must be 2000 characters or fewer."),

  body("type")
    .isIn(VALID_TYPES)
    .withMessage(`Type must be one of: ${VALID_TYPES.join(", ")}.`),

  body("occurredAt")
    .isISO8601().withMessage("occurredAt must be a valid date (YYYY-MM-DD).")
    .custom((val) => {
      if (new Date(val) > new Date()) throw new Error("occurredAt cannot be in the future.");
      return true;
    }),

  body("severity")
    .optional()
    .isIn(VALID_SEVERITIES)
    .withMessage(`Severity must be one of: ${VALID_SEVERITIES.join(", ")}.`),

  body("attachmentUrl")
    .optional()
    .isURL().withMessage("attachmentUrl must be a valid URL."),
];

// All fields optional for PATCH
const updateMedicalRecordRules = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 }).withMessage("Title must be between 1 and 200 characters."),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 }).withMessage("Description must be between 1 and 2000 characters."),

  body("type")
    .optional()
    .isIn(VALID_TYPES)
    .withMessage(`Type must be one of: ${VALID_TYPES.join(", ")}.`),

  body("occurredAt")
    .optional()
    .isISO8601().withMessage("occurredAt must be a valid date.")
    .custom((val) => {
      if (new Date(val) > new Date()) throw new Error("occurredAt cannot be in the future.");
      return true;
    }),

  body("severity")
    .optional()
    .isIn([...VALID_SEVERITIES, null, ""])
    .withMessage(`Severity must be one of: ${VALID_SEVERITIES.join(", ")}.`),

  body("attachmentUrl")
    .optional()
    .isURL().withMessage("attachmentUrl must be a valid URL."),
];

const historyQueryRules = [
  query("type")
    .optional()
    .isIn(VALID_TYPES)
    .withMessage(`Type must be one of: ${VALID_TYPES.join(", ")}.`),

  query("from")
    .optional()
    .isISO8601().withMessage("'from' must be a valid ISO date."),

  query("to")
    .optional()
    .isISO8601().withMessage("'to' must be a valid ISO date."),

  query("page")
    .optional()
    .isInt({ min: 1 }).withMessage("Page must be a positive integer."),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100."),
];

module.exports = {
  addMedicalRecordRules,
  updateMedicalRecordRules,
  historyQueryRules,
};
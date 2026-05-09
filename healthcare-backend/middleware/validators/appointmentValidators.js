const { body, query, param } = require("express-validator");

const VALID_STATUSES = ["pending", "confirmed", "completed", "cancelled"];

const createAppointmentRules = [
  body("patientID")
    .trim()
    .notEmpty()
    .withMessage("patientID is required."),

  body("staffId")
    .trim()
    .notEmpty()
    .withMessage("staffId (doctor) is required."),

  body("scheduledAt")
    .isISO8601()
    .withMessage("scheduledAt must be a valid ISO datetime (e.g. 2025-06-15T10:30:00).")
    .custom((val) => {
      if (new Date(val) <= new Date()) {
        throw new Error("Appointment must be scheduled in the future.");
      }
      return true;
    }),

  body("reason")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Reason must be 500 characters or fewer."),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes must be 1000 characters or fewer."),
];

const updateStatusRules = [
  body("status")
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(", ")}.`),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes must be 1000 characters or fewer."),
];

const listQueryRules = [
  query("status")
    .optional()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(", ")}.`),

  query("date")
    .optional()
    .isISO8601()
    .withMessage("date must be a valid ISO date (YYYY-MM-DD)."),

  query("from")
    .optional()
    .isISO8601()
    .withMessage("from must be a valid ISO date."),

  query("to")
    .optional()
    .isISO8601()
    .withMessage("to must be a valid ISO date."),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer."),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100."),
];

module.exports = { createAppointmentRules, updateStatusRules, listQueryRules };
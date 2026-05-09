const express    = require("express");
const rateLimit  = require("express-rate-limit");
const router     = express.Router();

const { verifyToken, staffOnly } = require("../middleware/authMiddleware");
const { validate }               = require("../middleware/validate");
const reportCtrl                 = require("../controllers/reportController");
const { query }                  = require("express-validator");

/**
 * PDF generation is CPU-intensive — a single report can take 200-500ms.
 * Rate limit to 20 reports per 15 minutes per IP to protect the server.
 */
const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message:  { error: "Report generation rate limit reached. Please wait before generating another report." },
});

const dateRangeRules = [
  query("from").optional().isISO8601().withMessage("'from' must be a valid ISO date."),
  query("to").optional().isISO8601().withMessage("'to' must be a valid ISO date."),
];

// All report routes: authenticated staff only
router.use(verifyToken, staffOnly, reportLimiter);

// Full patient summary PDF
router.get("/patient/:patientID/summary", reportCtrl.patientSummaryReport);

// Vitals history PDF — optional date range
router.get(
  "/patient/:patientID/vitals",
  dateRangeRules, validate,
  reportCtrl.vitalsHistoryReport
);

module.exports = router;
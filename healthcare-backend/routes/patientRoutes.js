const express = require("express");
const router  = express.Router();

const { verifyToken, staffOnly, clinicalStaffOnly } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validate");

const vitalsCtrl  = require("../controllers/vitalsController");
const historyCtrl = require("../controllers/medicalHistoryController");

const { recordVitalsRules, historyQueryRules: vitalsHistoryQuery } = require("../middleware/validators/vitalsValidators");
const {
  addMedicalRecordRules,
  updateMedicalRecordRules,
  historyQueryRules: medicalHistoryQuery,
} = require("../middleware/validators/medicalHistoryValidators");

// Every patient route requires a valid token
router.use(verifyToken);

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: specific named sub-paths must always come BEFORE wildcard params.
// e.g. /:patientID/vitals/latest before /:patientID/vitals/:id
//      /:patientID/history/timeline before /:patientID/history/:recordId
//      /:patientID/summary before /:patientID/:anything
// ─────────────────────────────────────────────────────────────────────────────

// ── Patient Overview ──────────────────────────────────────────────────────────

// Full chart overview: demographics + latest vitals + recent history + stats
router.get("/:patientID/summary", historyCtrl.getPatientSummary);

// ── Vitals ────────────────────────────────────────────────────────────────────

// Named sub-routes first
router.get("/:patientID/vitals/latest",  vitalsCtrl.getLatestVitals);
router.get("/:patientID/vitals/summary", vitalsCtrl.getVitalsSummary);
router.get(
  "/:patientID/vitals/history",
  vitalsHistoryQuery, validate,
  vitalsCtrl.getVitalsHistory
);

// Record new reading — clinical staff only
router.post(
  "/:patientID/vitals",
  clinicalStaffOnly,
  recordVitalsRules, validate,
  vitalsCtrl.recordVitals
);

// ── Medical History ───────────────────────────────────────────────────────────

// Named sub-routes first
router.get("/:patientID/history/timeline", historyCtrl.getTimelineView);

// Paginated list with filters
router.get(
  "/:patientID/history",
  medicalHistoryQuery, validate,
  historyCtrl.getMedicalHistory
);

// Add a new record — clinical staff only
router.post(
  "/:patientID/history",
  clinicalStaffOnly,
  addMedicalRecordRules, validate,
  historyCtrl.addMedicalRecord
);

// Single record — named :recordId param after specific named routes
router.get("/:patientID/history/:recordId", historyCtrl.getMedicalRecord);

// Update — clinical staff only, own-hospital check is inside the service
router.patch(
  "/:patientID/history/:recordId",
  clinicalStaffOnly,
  updateMedicalRecordRules, validate,
  historyCtrl.updateMedicalRecord
);

module.exports = router;
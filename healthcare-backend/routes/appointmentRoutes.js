const express = require("express");
const router  = express.Router();

const { verifyToken, staffOnly, clinicalStaffOnly, doctorOnly } = require("../middleware/authMiddleware");
const  validate  = require("../middleware/validate");
const apptCtrl = require("../controllers/appointmentController");
const {
  createAppointmentRules,
  updateStatusRules,
  listQueryRules,
} = require("../middleware/validators/appointmentValidators");

// All appointment routes require authentication
router.use(verifyToken);

// ─────────────────────────────────────────────────────────────────────────────
// Named routes BEFORE wildcard /:id
// ─────────────────────────────────────────────────────────────────────────────

// Hospital-wide appointment list — staff only
router.get(
  "/hospital",
  staffOnly,
  listQueryRules, validate,
  apptCtrl.getHospitalAppointments
);

// Doctor's own schedule — doctor only
router.get(
  "/schedule",
  doctorOnly,
  listQueryRules, validate,
  apptCtrl.getDoctorSchedule
);

// Specific patient's appointments — staff OR the patient themselves
// (patient access check is inside the controller)
router.get(
  "/patient/:patientID",
  listQueryRules, validate,
  apptCtrl.getPatientAppointments
);

// ─────────────────────────────────────────────────────────────────────────────
// Create
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  "/",
  clinicalStaffOnly,
  createAppointmentRules, validate,
  apptCtrl.createAppointment
);

// ─────────────────────────────────────────────────────────────────────────────
// Wildcard /:id — must come after all named routes
// ─────────────────────────────────────────────────────────────────────────────

// Single appointment — staff or patient (access check inside controller)
router.get("/:id", apptCtrl.getAppointment);

// Status update — staff only
router.patch(
  "/:id/status",
  clinicalStaffOnly,
  updateStatusRules, validate,
  apptCtrl.updateStatus
);

// Cancel — staff OR patient (access check inside controller)
router.delete("/:id", apptCtrl.cancelAppointment);

module.exports = router;
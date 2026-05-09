/**
 * Notifier — thin wrapper around io.to().emit() calls.
 *
 * Controllers call these functions instead of writing raw io.to().emit()
 * everywhere. Benefits:
 *   - Consistent payload shape across all events
 *   - Critical alerts automatically broadcast to BOTH patient room + hospital room
 *   - Easy to add logging, filtering, or persistence later without touching controllers
 *
 * Usage:
 *   const notify = require("../socket/notifier");
 *   notify.newVitals(req.app.get("io"), { patientID, hospitalId, reading, alerts, recordedBy });
 */

const EVENTS = require("./events");

/**
 * Emitted when a new vitals reading is recorded.
 * Goes to the patient's room (doctors watching the chart) +
 * the patient's own private channel (so they can see it on their dashboard).
 */
const newVitals = (io, { patientID, patientDbId, reading, alerts, recordedBy }) => {
  const payload = { reading, alerts, recordedBy, hasAlerts: alerts.length > 0 };

  io.to(`patient:${patientID}`).emit(EVENTS.VITALS_NEW, payload);
  io.to(`patient-self:${patientDbId}`).emit(EVENTS.VITALS_NEW, payload);
};

/**
 * Emitted when one or more vitals readings are in the critical range.
 * Goes to the patient room AND the hospital room so any doctor in that
 * hospital's dashboard sees the alert, not just those watching the specific patient.
 */
const criticalVitals = (io, { patientID, patientDbId, hospitalId, patientName, alerts, recordedAt }) => {
  const payload = { patientID, patientName, alerts, recordedAt };

  // Everyone watching this patient
  io.to(`patient:${patientID}`).emit(EVENTS.VITALS_CRITICAL, payload);

  // Everyone in the hospital (urgent — any available doctor should see this)
  io.to(`hospital:${hospitalId}`).emit(EVENTS.VITALS_CRITICAL, {
    ...payload,
    message: `⚠ Critical vitals recorded for patient ${patientID} (${patientName})`,
  });

  // Also push to patient's own channel
  io.to(`patient-self:${patientDbId}`).emit(EVENTS.VITALS_CRITICAL, payload);
};

/**
 * Emitted when a new medical history record is added.
 */
const newMedicalRecord = (io, { patientID, patientDbId, record, addedBy }) => {
  const payload = { record, addedBy };
  io.to(`patient:${patientID}`).emit(EVENTS.HISTORY_NEW, payload);
  io.to(`patient-self:${patientDbId}`).emit(EVENTS.HISTORY_NEW, payload);
};

/**
 * Emitted when an appointment status changes.
 */
const appointmentUpdated = (io, { patientID, patientDbId, staffId, appointment }) => {
  const payload = { appointment };
  io.to(`patient:${patientID}`).emit(EVENTS.APPOINTMENT_UPDATED, payload);
  io.to(`patient-self:${patientDbId}`).emit(EVENTS.APPOINTMENT_UPDATED, payload);
  io.to(`staff:${staffId}`).emit(EVENTS.APPOINTMENT_UPDATED, payload);
};

/**
 * Generic notification push to a specific user.
 * type: "info" | "success" | "warning" | "error"
 */
const notify = (io, { userId, userType, title, message, type = "info", data = {} }) => {
  const room = userType === "patient"
    ? `patient-self:${userId}`
    : `staff:${userId}`;

  io.to(room).emit(EVENTS.NOTIFICATION, { title, message, type, data, timestamp: new Date() });
};

module.exports = { newVitals, criticalVitals, newMedicalRecord, appointmentUpdated, notify };
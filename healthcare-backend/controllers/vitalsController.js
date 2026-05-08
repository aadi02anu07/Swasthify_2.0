const vitalsService = require("../services/vitalsService");

/**
 * POST /api/patients/:patientID/vitals
 * Clinical staff records a new vitals reading.
 * Emits real-time update via Socket.IO to anyone watching this patient's room.
 */
const recordVitals = async (req, res, next) => {
  try {
    const { patientID } = req.params;
    const staffId    = req.user.id;
    const hospitalId = req.user.hospitalId;

    const { reading, alerts, patient } = await vitalsService.recordVitals(
      patientID, staffId, hospitalId, req.body
    );

    // Push live update to all connected clients watching this patient
    const io = req.app.get("io");
    io.to(`patient:${patientID}`).emit("vitals:new", {
      reading,
      alerts,
      recordedBy: req.user.name,
    });

    // If critical alerts exist, emit a separate urgent event
    const criticalAlerts = alerts.filter((a) => a.severity === "critical");
    if (criticalAlerts.length > 0) {
      io.to(`patient:${patientID}`).emit("vitals:critical", {
        patientID,
        patientName: patient.name,
        alerts: criticalAlerts,
        recordedAt: reading.recordedAt,
      });
    }

    res.status(201).json({
      message:  "Vitals recorded successfully.",
      reading,
      alerts,           // always return alerts — empty array if all normal
      hasAlerts: alerts.length > 0,
      hasCritical: criticalAlerts.length > 0,
    });
  } catch (err) { next(err); }
};

/**
 * GET /api/patients/:patientID/vitals/latest
 * Returns the most recent vitals reading. Used for dashboard summary cards.
 * Served from Redis cache when available.
 */
const getLatestVitals = async (req, res, next) => {
  try {
    const { patientID } = req.params;
    const result = await vitalsService.getLatestVitals(patientID);

    if (!result.reading) {
      return res.status(200).json({
        message: "No vitals recorded yet.",
        patient: result.patient,
        reading: null,
      });
    }

    res.status(200).json(result);
  } catch (err) { next(err); }
};

/**
 * GET /api/patients/:patientID/vitals/history
 * Time-series array of all vitals — designed to feed chart libraries directly.
 *
 * Query params:
 *   from    — ISO date string (e.g. 2024-01-01)
 *   to      — ISO date string
 *   limit   — max records to return (default 100, max 500)
 */
const getVitalsHistory = async (req, res, next) => {
  try {
    const { patientID } = req.params;
    const { from, to, limit } = req.query;

    const result = await vitalsService.getVitalsHistory(patientID, { from, to, limit });

    res.status(200).json(result);
  } catch (err) { next(err); }
};

/**
 * GET /api/patients/:patientID/vitals/summary
 * Aggregated stats (averages, min/max, total readings).
 * Used for the analytics dashboard.
 */
const getVitalsSummary = async (req, res, next) => {
  try {
    const { patientID } = req.params;
    const { from, to }  = req.query;

    const result = await vitalsService.getVitalsSummary(patientID, { from, to });
    res.status(200).json(result);
  } catch (err) { next(err); }
};

module.exports = {
  recordVitals,
  getLatestVitals,
  getVitalsHistory,
  getVitalsSummary,
};
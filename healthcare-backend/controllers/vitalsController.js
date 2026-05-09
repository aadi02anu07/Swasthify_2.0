const vitalsService = require("../services/vitalsService");
const notifier      = require("../socket/notifier");

/**
 * POST /api/patients/:patientID/vitals
 */
const recordVitals = async (req, res, next) => {
  try {
    const { patientID } = req.params;
    const staffId       = req.user.id;
    const hospitalId    = req.user.hospitalId;

    const { reading, alerts, patient } = await vitalsService.recordVitals(
      patientID, staffId, hospitalId, req.body
    );

    const io = req.app.get("io");

    // Notify everyone watching this patient
    notifier.newVitals(io, {
      patientID,
      patientDbId: patient.id,
      reading,
      alerts,
      recordedBy: req.user.name,
    });

    // Critical alerts also go to the hospital room
    const criticalAlerts = alerts.filter((a) => a.severity === "critical");
    if (criticalAlerts.length > 0) {
      notifier.criticalVitals(io, {
        patientID,
        patientDbId: patient.id,
        hospitalId,
        patientName: patient.name,
        alerts:      criticalAlerts,
        recordedAt:  reading.recordedAt,
      });
    }

    res.status(201).json({
      message:     "Vitals recorded successfully.",
      reading,
      alerts,
      hasAlerts:   alerts.length > 0,
      hasCritical: criticalAlerts.length > 0,
    });
  } catch (err) { next(err); }
};

/**
 * GET /api/patients/:patientID/vitals/latest
 */
const getLatestVitals = async (req, res, next) => {
  try {
    const result = await vitalsService.getLatestVitals(req.params.patientID);

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
 * Query params: from, to, limit
 */
const getVitalsHistory = async (req, res, next) => {
  try {
    const { from, to, limit } = req.query;
    const result = await vitalsService.getVitalsHistory(
      req.params.patientID, { from, to, limit }
    );
    res.status(200).json(result);
  } catch (err) { next(err); }
};

/**
 * GET /api/patients/:patientID/vitals/summary
 */
const getVitalsSummary = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const result = await vitalsService.getVitalsSummary(
      req.params.patientID, { from, to }
    );
    res.status(200).json(result);
  } catch (err) { next(err); }
};

module.exports = { recordVitals, getLatestVitals, getVitalsHistory, getVitalsSummary };
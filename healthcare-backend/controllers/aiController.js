const aiService = require("../services/aiService");

/**
 * POST /api/ai/analyze/vitals/:patientID
 *
 * Analyze recent vitals history for trends and anomalies.
 * Fastest analysis — vitals only, no medical history.
 * Best used after recording a new reading or on dashboard load.
 */
const analyzeVitals = async (req, res, next) => {
  try {
    const result = await aiService.analyzeVitals(req.params.patientID);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

/**
 * POST /api/ai/analyze/chart/:patientID
 *
 * Full chart analysis — vitals history + medical history combined.
 * Richer and slower. Use before consultations or when inheriting a new patient.
 */
const analyzeFullChart = async (req, res, next) => {
  try {
    const result = await aiService.analyzeFullChart(req.params.patientID);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

module.exports = { analyzeVitals, analyzeFullChart };
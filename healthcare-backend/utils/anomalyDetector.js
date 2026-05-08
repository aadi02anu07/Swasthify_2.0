/**
 * Simple rule-based anomaly detection for vital signs.
 *
 * This runs synchronously on every new vitals submission and returns
 * structured alerts that get sent back in the API response AND pushed
 * via Socket.IO to any connected doctor dashboards.
 *
 * Later, the Gemini AI endpoint will do deeper contextual analysis
 * (e.g. "this heart rate spike makes sense given the patient's recent surgery").
 * This layer catches the immediate, obvious red flags.
 */

const THRESHOLDS = {
  heartRate: {
    min: 60, max: 100, unit: "bpm", label: "Heart Rate",
    criticalMin: 40, criticalMax: 150,
  },
  bpSystolic: {
    min: 90, max: 140, unit: "mmHg", label: "Systolic BP",
    criticalMin: 70, criticalMax: 180,
  },
  bpDiastolic: {
    min: 60, max: 90, unit: "mmHg", label: "Diastolic BP",
    criticalMin: 40, criticalMax: 120,
  },
  sugar: {
    min: 70, max: 140, unit: "mg/dL", label: "Blood Sugar",
    criticalMin: 50, criticalMax: 300,
  },
  spo2: {
    min: 95, max: 100, unit: "%", label: "SpO₂",
    criticalMin: 90, criticalMax: null, // no upper critical for SpO2
  },
  temperature: {
    min: 36.1, max: 37.5, unit: "°C", label: "Temperature",
    criticalMin: 35.0, criticalMax: 39.5,
  },
};

/**
 * @param {object} vitals - the recorded vitals object
 * @returns {Array} alerts - array of { metric, label, value, unit, severity, message }
 */
const detectAnomalies = (vitals) => {
  const alerts = [];

  for (const [metric, range] of Object.entries(THRESHOLDS)) {
    const value = vitals[metric];
    if (value == null) continue;

    let severity = null;
    let direction = null;

    if (range.criticalMin != null && value < range.criticalMin) {
      severity  = "critical";
      direction = "low";
    } else if (range.criticalMax != null && value > range.criticalMax) {
      severity  = "critical";
      direction = "high";
    } else if (value < range.min) {
      severity  = "warning";
      direction = "low";
    } else if (range.max != null && value > range.max) {
      severity  = "warning";
      direction = "high";
    }

    if (severity) {
      alerts.push({
        metric,
        label:    range.label,
        value,
        unit:     range.unit,
        severity,
        direction,
        normalRange: `${range.min}–${range.max} ${range.unit}`,
        message: `${range.label} is ${direction} (${value} ${range.unit}). Normal range: ${range.min}–${range.max} ${range.unit}.`,
      });
    }
  }

  return alerts;
};

module.exports = { detectAnomalies, THRESHOLDS };
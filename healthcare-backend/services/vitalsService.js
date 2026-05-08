const prisma  = require("../config/db");
const { cacheSet, cacheGet, cacheDel } = require("../config/redis");
const { detectAnomalies } = require("../utils/anomalyDetector");

// Cache TTL for latest vitals — 60 seconds
// Short because nurses may record back-to-back; we want near-real-time freshness.
const LATEST_CACHE_TTL = 60;
const SUMMARY_CACHE_TTL = 300; // 5 min for aggregate stats

// ── Internal helpers ──────────────────────────────────────────────────────────

const findPatient = async (patientID) => {
  const patient = await prisma.patient.findUnique({
    where:  { patientID },
    select: { id: true, patientID: true, name: true, dob: true, bloodGroup: true },
  });
  if (!patient) throw { status: 404, message: `Patient '${patientID}' not found.` };
  return patient;
};

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Record a new vitals reading.
 * - Inserts into vitals_history (append-only)
 * - Runs anomaly detection
 * - Busts the cached latest reading for this patient
 * - Returns the saved reading + any anomaly alerts
 */
const recordVitals = async (patientID, staffId, hospitalId, data) => {
  const patient = await findPatient(patientID);

  const { bpSystolic, bpDiastolic, heartRate, sugar, weight, spo2, temperature, notes } = data;

  const reading = await prisma.vitalsHistory.create({
    data: {
      patientId:    patient.id,
      hospitalId,
      recordedById: staffId,
      bpSystolic,
      bpDiastolic,
      heartRate,
      sugar,
      weight,
      spo2,
      temperature,
      notes,
    },
    include: {
      recordedBy: { select: { name: true, role: true } },
      hospital:   { select: { name: true, city: true } },
    },
  });

  // Bust cached latest vitals for this patient
  await cacheDel(`vitals:latest:${patient.id}`);
  await cacheDel(`vitals:summary:${patient.id}`);

  const alerts = detectAnomalies({ bpSystolic, bpDiastolic, heartRate, sugar, spo2, temperature });

  return { reading, alerts, patient };
};

/**
 * Get a patient's full vitals history as a time-series array.
 * Supports date range filtering and a limit.
 * Designed to feed directly into chart libraries on the frontend.
 */
const getVitalsHistory = async (patientID, { from, to, limit = 100 }) => {
  const patient = await findPatient(patientID);

  // Cap limit to prevent huge payloads
  const take = Math.min(parseInt(limit), 500);

  const where = { patientId: patient.id };
  if (from || to) {
    where.recordedAt = {};
    if (from) where.recordedAt.gte = new Date(from);
    if (to)   where.recordedAt.lte = new Date(to);
  }

  const readings = await prisma.vitalsHistory.findMany({
    where,
    orderBy: { recordedAt: "asc" }, // ascending so charts render left-to-right chronologically
    take,
    select: {
      id:          true,
      bpSystolic:  true,
      bpDiastolic: true,
      heartRate:   true,
      sugar:       true,
      weight:      true,
      spo2:        true,
      temperature: true,
      notes:       true,
      recordedAt:  true,
      hospital:    { select: { name: true } },
      recordedBy:  { select: { name: true, role: true } },
    },
  });

  return { patient, readings, total: readings.length };
};

/**
 * Get the single most recent vitals reading for a patient.
 * Cached in Redis for 60 seconds since this is called on every dashboard load.
 */
const getLatestVitals = async (patientID) => {
  const patient = await findPatient(patientID);

  const cacheKey = `vitals:latest:${patient.id}`;
  const cached   = await cacheGet(cacheKey);
  if (cached) return { patient, reading: cached, fromCache: true };

  const reading = await prisma.vitalsHistory.findFirst({
    where:   { patientId: patient.id },
    orderBy: { recordedAt: "desc" },
    select: {
      id:          true,
      bpSystolic:  true,
      bpDiastolic: true,
      heartRate:   true,
      sugar:       true,
      weight:      true,
      spo2:        true,
      temperature: true,
      notes:       true,
      recordedAt:  true,
      hospital:    { select: { name: true } },
      recordedBy:  { select: { name: true, role: true } },
    },
  });

  if (reading) await cacheSet(cacheKey, reading, LATEST_CACHE_TTL);

  return { patient, reading, fromCache: false };
};

/**
 * Aggregate stats for the patient's vitals dashboard card.
 * Returns averages, min/max, and trend info across all time or a date range.
 * Cached for 5 minutes — it's expensive to compute across many rows.
 */
const getVitalsSummary = async (patientID, { from, to } = {}) => {
  const patient = await findPatient(patientID);

  const cacheKey = `vitals:summary:${patient.id}`;
  const cached   = await cacheGet(cacheKey);
  if (cached) return { patient, summary: cached };

  const where = { patientId: patient.id };
  if (from || to) {
    where.recordedAt = {};
    if (from) where.recordedAt.gte = new Date(from);
    if (to)   where.recordedAt.lte = new Date(to);
  }

  // Prisma doesn't have a built-in aggregate for multiple fields in one call,
  // so we use _avg, _min, _max together.
  const agg = await prisma.vitalsHistory.aggregate({
    where,
    _avg: { bpSystolic: true, bpDiastolic: true, heartRate: true, sugar: true, spo2: true, temperature: true },
    _min: { bpSystolic: true, heartRate: true, sugar: true, spo2: true, recordedAt: true },
    _max: { bpSystolic: true, heartRate: true, sugar: true, spo2: true, recordedAt: true },
    _count: { id: true },
  });

  const round = (v) => (v != null ? Math.round(v * 10) / 10 : null);

  const summary = {
    totalReadings:     agg._count.id,
    firstRecordedAt:   agg._min.recordedAt,
    lastRecordedAt:    agg._max.recordedAt,
    averages: {
      bpSystolic:  round(agg._avg.bpSystolic),
      bpDiastolic: round(agg._avg.bpDiastolic),
      heartRate:   round(agg._avg.heartRate),
      sugar:       round(agg._avg.sugar),
      spo2:        round(agg._avg.spo2),
      temperature: round(agg._avg.temperature),
    },
    ranges: {
      heartRate: { min: agg._min.heartRate, max: agg._max.heartRate },
      bpSystolic: { min: agg._min.bpSystolic, max: agg._max.bpSystolic },
      sugar:      { min: agg._min.sugar,      max: agg._max.sugar },
      spo2:       { min: agg._min.spo2,       max: agg._max.spo2 },
    },
  };

  await cacheSet(cacheKey, summary, SUMMARY_CACHE_TTL);

  return { patient, summary };
};

module.exports = {
  recordVitals,
  getVitalsHistory,
  getLatestVitals,
  getVitalsSummary,
};
const prisma = require("../config/db");

// ── Helpers ───────────────────────────────────────────────────────────────────

const findPatient = async (patientID) => {
  const patient = await prisma.patient.findUnique({
    where:  { patientID },
    select: {
      id: true, patientID: true, name: true, dob: true,
      bloodGroup: true, gender: true, phone: true, emergencyContact: true,
    },
  });
  if (!patient) throw { status: 404, message: `Patient '${patientID}' not found.` };
  return patient;
};

const computeAge = (dob) =>
  Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Assemble all data needed for the Patient Summary PDF.
 * Runs 5 queries in parallel — this is the one place in the system
 * where we intentionally fetch everything at once for a snapshot.
 */
const getPatientSummaryData = async (patientID, requestingUser) => {
  const patient = await findPatient(patientID);

  const now = new Date();

  const [latestVitals, vitalsSummaryAgg, medicalHistory, appointments] = await Promise.all([
    // Latest vitals reading
    prisma.vitalsHistory.findFirst({
      where:   { patientId: patient.id },
      orderBy: { recordedAt: "desc" },
      include: {
        recordedBy: { select: { name: true, role: true } },
        hospital:   { select: { name: true, city: true } },
      },
    }),

    // Aggregate stats
    prisma.vitalsHistory.aggregate({
      where: { patientId: patient.id },
      _avg:   { bpSystolic: true, bpDiastolic: true, heartRate: true, sugar: true, spo2: true, temperature: true },
      _count: { id: true },
    }),

    // Full medical history (all records for the report — no limit)
    prisma.medicalHistory.findMany({
      where:   { patientId: patient.id },
      orderBy: { occurredAt: "desc" },
      include: { hospital: { select: { name: true } } },
    }),

    // Upcoming appointments only
    prisma.appointment.findMany({
      where: {
        patientId:   patient.id,
        status:      { in: ["pending", "confirmed"] },
        scheduledAt: { gte: now },
      },
      orderBy: { scheduledAt: "asc" },
      take:    10,
      include: {
        staff:    { select: { name: true, role: true } },
        hospital: { select: { name: true } },
      },
    }),
  ]);

  const round = (v) => (v != null ? Math.round(v * 10) / 10 : null);
  const avg   = vitalsSummaryAgg._avg;

  return {
    patient,
    demographics: { age: computeAge(patient.dob) },
    latestVitals,
    vitalsSummary: {
      totalReadings: vitalsSummaryAgg._count.id,
      averages: {
        bpSystolic:  round(avg.bpSystolic),
        bpDiastolic: round(avg.bpDiastolic),
        heartRate:   round(avg.heartRate),
        sugar:       round(avg.sugar),
        spo2:        round(avg.spo2),
        temperature: round(avg.temperature),
      },
    },
    medicalHistory,
    appointments,
  };
};

/**
 * Assemble vitals time-series data for the Vitals History PDF.
 * Respects the same date range filters as the API endpoint.
 */
const getVitalsHistoryData = async (patientID, { from, to } = {}) => {
  const patient = await findPatient(patientID);

  const where = { patientId: patient.id };
  if (from || to) {
    where.recordedAt = {};
    if (from) where.recordedAt.gte = new Date(from);
    if (to)   where.recordedAt.lte = new Date(to);
  }

  const readings = await prisma.vitalsHistory.findMany({
    where,
    orderBy: { recordedAt: "asc" },  // chronological for the table
    select: {
      bpSystolic: true, bpDiastolic: true, heartRate: true,
      sugar: true, spo2: true, temperature: true, weight: true,
      recordedAt: true,
      hospital: { select: { name: true } },
    },
  });

  return { patient, readings };
};

module.exports = { getPatientSummaryData, getVitalsHistoryData };
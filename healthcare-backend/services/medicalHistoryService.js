const prisma = require("../config/db");
const { cacheSet, cacheGet, cacheDel } = require("../config/redis");

const HISTORY_CACHE_TTL  = 120; // 2 min — medical records change less often than vitals
const SUMMARY_CACHE_TTL  = 60;

// ── Internal helpers ──────────────────────────────────────────────────────────

const findPatient = async (patientID) => {
  const patient = await prisma.patient.findUnique({
    where:  { patientID },
    select: { id: true, patientID: true, name: true, dob: true, bloodGroup: true, gender: true },
  });
  if (!patient) throw { status: 404, message: `Patient '${patientID}' not found.` };
  return patient;
};

const findRecord = async (recordId, patientId) => {
  const record = await prisma.medicalHistory.findFirst({
    where: { id: recordId, patientId },
  });
  if (!record) throw { status: 404, message: "Medical record not found." };
  return record;
};

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Add a new medical history record.
 * Any verified hospital's clinical staff can add records for any patient.
 * Records are tagged with the hospital that created them.
 */
const addMedicalRecord = async (patientID, staffId, hospitalId, data) => {
  const patient = await findPatient(patientID);

  const { title, description, type, severity, attachmentUrl, occurredAt } = data;

  const record = await prisma.medicalHistory.create({
    data: {
      patientId:    patient.id,
      hospitalId,
      recordedById: staffId,
      title,
      description,
      type,
      severity:     severity || null,
      attachmentUrl: attachmentUrl || null,
      occurredAt:   new Date(occurredAt),
    },
    include: {
      hospital:   { select: { name: true, city: true } },
      recordedBy: { select: { name: true, role: true } },
    },
  });

  // Bust caches
  await cacheDel(`history:list:${patient.id}`);
  await cacheDel(`history:timeline:${patient.id}`);
  await cacheDel(`patient:summary:${patient.id}`);

  return { record, patient };
};

/**
 * Get paginated medical history for a patient.
 * Filterable by record type and date range.
 * This is the main list view — used for the history tab on a patient's chart.
 */
const getMedicalHistory = async (patientID, { type, from, to, page = 1, limit = 20 } = {}) => {
  const patient = await findPatient(patientID);

  const take = Math.min(parseInt(limit), 100);
  const skip = (parseInt(page) - 1) * take;

  const where = { patientId: patient.id };
  if (type)     where.type = type;
  if (from || to) {
    where.occurredAt = {};
    if (from) where.occurredAt.gte = new Date(from);
    if (to)   where.occurredAt.lte = new Date(to);
  }

  const [records, total] = await Promise.all([
    prisma.medicalHistory.findMany({
      where,
      orderBy: { occurredAt: "desc" }, // most recent event first
      take,
      skip,
      select: {
        id:            true,
        title:         true,
        description:   true,
        type:          true,
        severity:      true,
        attachmentUrl: true,
        occurredAt:    true,
        recordedAt:    true,
        hospital:      { select: { name: true, city: true } },
        recordedBy:    { select: { name: true, role: true } },
      },
    }),
    prisma.medicalHistory.count({ where }),
  ]);

  return {
    patient,
    records,
    pagination: {
      page:       parseInt(page),
      limit:      take,
      total,
      totalPages: Math.ceil(total / take),
      hasMore:    skip + take < total,
    },
  };
};

/**
 * Get a single medical record by ID.
 * Verifies the record actually belongs to this patient (prevents enumeration attacks).
 */
const getMedicalRecord = async (patientID, recordId) => {
  const patient = await findPatient(patientID);
  const record  = await prisma.medicalHistory.findFirst({
    where: { id: recordId, patientId: patient.id },
    include: {
      hospital:   { select: { name: true, city: true, state: true } },
      recordedBy: { select: { name: true, role: true } },
    },
  });
  if (!record) throw { status: 404, message: "Medical record not found." };
  return { patient, record };
};

/**
 * Update an existing medical record.
 * IMPORTANT: only staff from the hospital that created the record can edit it.
 * Staff from other hospitals can read but not modify — this preserves record integrity.
 */
const updateMedicalRecord = async (patientID, recordId, staffId, hospitalId, data) => {
  const patient = await findPatient(patientID);
  const record  = await findRecord(recordId, patient.id);

  // Cross-hospital write protection
  if (record.hospitalId !== hospitalId) {
    throw {
      status: 403,
      message: "You can only edit records created by your hospital.",
    };
  }

  const { title, description, type, severity, attachmentUrl, occurredAt } = data;

  const updated = await prisma.medicalHistory.update({
    where: { id: recordId },
    data: {
      ...(title         && { title }),
      ...(description   && { description }),
      ...(type          && { type }),
      ...(severity      !== undefined && { severity }),
      ...(attachmentUrl !== undefined && { attachmentUrl }),
      ...(occurredAt    && { occurredAt: new Date(occurredAt) }),
    },
    include: {
      hospital:   { select: { name: true, city: true } },
      recordedBy: { select: { name: true, role: true } },
    },
  });

  // Bust caches
  await cacheDel(`history:list:${patient.id}`);
  await cacheDel(`history:timeline:${patient.id}`);
  await cacheDel(`patient:summary:${patient.id}`);

  return { record: updated, patient };
};

/**
 * Timeline view — all records grouped by year, sorted newest year first.
 * This powers the visual timeline on the patient's full history page.
 * Cached because it's expensive to compute and changes infrequently.
 */
const getTimelineView = async (patientID) => {
  const patient  = await findPatient(patientID);
  const cacheKey = `history:timeline:${patient.id}`;
  const cached   = await cacheGet(cacheKey);
  if (cached) return { patient, timeline: cached };

  const records = await prisma.medicalHistory.findMany({
    where:   { patientId: patient.id },
    orderBy: { occurredAt: "desc" },
    select: {
      id:            true,
      title:         true,
      description:   true,
      type:          true,
      severity:      true,
      attachmentUrl: true,
      occurredAt:    true,
      hospital:      { select: { name: true, city: true } },
      recordedBy:    { select: { name: true, role: true } },
    },
  });

  // Group by year
  const grouped = {};
  for (const record of records) {
    const year = new Date(record.occurredAt).getFullYear();
    if (!grouped[year]) grouped[year] = [];
    grouped[year].push(record);
  }

  // Convert to sorted array: [ { year: 2025, records: [...] }, ... ]
  const timeline = Object.keys(grouped)
    .sort((a, b) => b - a)
    .map((year) => ({ year: parseInt(year), records: grouped[year] }));

  await cacheSet(cacheKey, timeline, HISTORY_CACHE_TTL);

  return { patient, timeline };
};

/**
 * Patient summary — the full chart overview a doctor sees when opening a patient.
 * Combines demographics + latest vitals + recent medical history.
 * This is the most-called endpoint in the whole system, so it's aggressively cached.
 */
const getPatientSummary = async (patientID) => {
  const patient  = await findPatient(patientID);
  const cacheKey = `patient:summary:${patient.id}`;
  const cached   = await cacheGet(cacheKey);
  if (cached) return { patient, ...cached };

  const [latestVitals, recentHistory, totalVitals, totalHistory] = await Promise.all([
    prisma.vitalsHistory.findFirst({
      where:   { patientId: patient.id },
      orderBy: { recordedAt: "desc" },
      select: {
        bpSystolic: true, bpDiastolic: true, heartRate: true,
        sugar: true, spo2: true, temperature: true, recordedAt: true,
      },
    }),
    prisma.medicalHistory.findMany({
      where:   { patientId: patient.id },
      orderBy: { occurredAt: "desc" },
      take:    5,
      select: {
        id: true, title: true, type: true,
        severity: true, occurredAt: true,
        hospital: { select: { name: true } },
      },
    }),
    prisma.vitalsHistory.count({ where: { patientId: patient.id } }),
    prisma.medicalHistory.count({ where: { patientId: patient.id } }),
  ]);

  // Compute age from dob
  const dob = new Date(patient.dob);
  const age  = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  const summary = {
    demographics:   { ...patient, age },
    latestVitals,
    recentHistory,
    stats: { totalVitals, totalHistory },
  };

  await cacheSet(cacheKey, summary, SUMMARY_CACHE_TTL);

  return { patient, ...summary };
};

module.exports = {
  addMedicalRecord,
  getMedicalHistory,
  getMedicalRecord,
  updateMedicalRecord,
  getTimelineView,
  getPatientSummary,
};
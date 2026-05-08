const medicalHistoryService = require("../services/medicalHistoryService");

/**
 * POST /api/patients/:patientID/history
 * Clinical staff adds a medical record (diagnosis, surgery, allergy, etc.)
 */
const addMedicalRecord = async (req, res, next) => {
  try {
    const { patientID } = req.params;
    const staffId    = req.user.id;
    const hospitalId = req.user.hospitalId;

    const { record, patient } = await medicalHistoryService.addMedicalRecord(
      patientID, staffId, hospitalId, req.body
    );

    // Notify connected clients — a doctor viewing this patient's chart
    // gets a live badge update that a new record was added
    const io = req.app.get("io");
    io.to(`patient:${patientID}`).emit("history:new", {
      record,
      addedBy: req.user.name,
    });

    res.status(201).json({
      message: "Medical record added successfully.",
      record,
    });
  } catch (err) { next(err); }
};

/**
 * GET /api/patients/:patientID/history
 * Paginated list with optional filters by type and date range.
 *
 * Query params:
 *   type   — diagnosis | surgery | allergy | medication | lab_result | vaccination | imaging
 *   from   — ISO date
 *   to     — ISO date
 *   page   — page number (default 1)
 *   limit  — records per page (default 20, max 100)
 */
const getMedicalHistory = async (req, res, next) => {
  try {
    const { patientID } = req.params;
    const { type, from, to, page, limit } = req.query;

    const result = await medicalHistoryService.getMedicalHistory(
      patientID, { type, from, to, page, limit }
    );

    res.status(200).json(result);
  } catch (err) { next(err); }
};

/**
 * GET /api/patients/:patientID/history/timeline
 * All records grouped by year — powers the visual timeline on the frontend.
 * Must be declared BEFORE /:recordId to prevent Express routing conflict.
 */
const getTimelineView = async (req, res, next) => {
  try {
    const result = await medicalHistoryService.getTimelineView(req.params.patientID);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

/**
 * GET /api/patients/:patientID/summary
 * The full chart overview: demographics + latest vitals + recent history + stats.
 * This is what a doctor sees the moment they open a patient's profile.
 */
const getPatientSummary = async (req, res, next) => {
  try {
    const result = await medicalHistoryService.getPatientSummary(req.params.patientID);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

/**
 * GET /api/patients/:patientID/history/:recordId
 * Single record — full detail view with hospital and staff info.
 */
const getMedicalRecord = async (req, res, next) => {
  try {
    const { patientID, recordId } = req.params;
    const result = await medicalHistoryService.getMedicalRecord(patientID, recordId);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

/**
 * PATCH /api/patients/:patientID/history/:recordId
 * Update a record — only the hospital that created it can edit.
 * All fields optional; only provided fields are updated.
 */
const updateMedicalRecord = async (req, res, next) => {
  try {
    const { patientID, recordId } = req.params;
    const staffId    = req.user.id;
    const hospitalId = req.user.hospitalId;

    const { record } = await medicalHistoryService.updateMedicalRecord(
      patientID, recordId, staffId, hospitalId, req.body
    );

    res.status(200).json({
      message: "Medical record updated.",
      record,
    });
  } catch (err) { next(err); }
};

module.exports = {
  addMedicalRecord,
  getMedicalHistory,
  getMedicalRecord,
  updateMedicalRecord,
  getTimelineView,
  getPatientSummary,
};
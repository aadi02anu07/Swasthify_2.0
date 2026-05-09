const medicalHistoryService = require("../services/medicalHistoryService");
const notifier              = require("../socket/notifier");

/**
 * POST /api/patients/:patientID/history
 */
const addMedicalRecord = async (req, res, next) => {
  try {
    const { patientID } = req.params;
    const staffId       = req.user.id;
    const hospitalId    = req.user.hospitalId;

    const { record, patient } = await medicalHistoryService.addMedicalRecord(
      patientID, staffId, hospitalId, req.body
    );

    notifier.newMedicalRecord(req.app.get("io"), {
      patientID,
      patientDbId: patient.id,
      record,
      addedBy: req.user.name,
    });

    res.status(201).json({ message: "Medical record added successfully.", record });
  } catch (err) { next(err); }
};

/**
 * GET /api/patients/:patientID/history
 */
const getMedicalHistory = async (req, res, next) => {
  try {
    const { type, from, to, page, limit } = req.query;
    const result = await medicalHistoryService.getMedicalHistory(
      req.params.patientID, { type, from, to, page, limit }
    );
    res.status(200).json(result);
  } catch (err) { next(err); }
};

/**
 * GET /api/patients/:patientID/history/timeline
 */
const getTimelineView = async (req, res, next) => {
  try {
    const result = await medicalHistoryService.getTimelineView(req.params.patientID);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

/**
 * GET /api/patients/:patientID/summary
 */
const getPatientSummary = async (req, res, next) => {
  try {
    const result = await medicalHistoryService.getPatientSummary(req.params.patientID);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

/**
 * GET /api/patients/:patientID/history/:recordId
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
 */
const updateMedicalRecord = async (req, res, next) => {
  try {
    const { patientID, recordId } = req.params;
    const { record } = await medicalHistoryService.updateMedicalRecord(
      patientID, recordId, req.user.id, req.user.hospitalId, req.body
    );
    res.status(200).json({ message: "Medical record updated.", record });
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
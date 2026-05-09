const reportService = require("../services/reportService");
const { createDoc, buildPatientSummary, buildVitalsHistory } = require("../utils/pdfGenerator");
const prisma = require("../config/db");

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Sets response headers for a downloadable PDF and pipes the doc to res. */
const streamPDF = (res, doc, filename) => {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  doc.pipe(res);
};

/** Fetches the hospital name of the requesting staff member for the PDF header. */
const getHospitalName = async (hospitalId) => {
  if (!hospitalId) return null;
  const hospital = await prisma.hospital.findUnique({
    where:  { id: hospitalId },
    select: { name: true },
  });
  return hospital?.name ?? null;
};

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /api/reports/patient/:patientID/summary
 *
 * Streams a full Patient Summary PDF:
 *   demographics + latest vitals + averages + full medical history + upcoming appointments
 *
 * This is the document a doctor prints before a consultation or
 * shares with another hospital when referring a patient.
 */
const patientSummaryReport = async (req, res, next) => {
  try {
    const { patientID } = req.params;

    const [data, hospitalName] = await Promise.all([
      reportService.getPatientSummaryData(patientID, req.user),
      getHospitalName(req.user.hospitalId),
    ]);

    const doc = createDoc();
    streamPDF(res, doc, `swasthify-${patientID}-summary.pdf`);

    buildPatientSummary(doc, {
      ...data,
      generatedBy:  req.user.name,
      hospitalName,
    });

    doc.end();
  } catch (err) { next(err); }
};

/**
 * GET /api/reports/patient/:patientID/vitals
 *
 * Streams a Vitals History PDF — a paginated table of all vitals readings,
 * optionally filtered by date range.
 *
 * Query params:
 *   from — ISO date (e.g. 2025-01-01)
 *   to   — ISO date
 *
 * Use case: longitudinal monitoring, sharing with another specialist,
 * insurance documentation.
 */
const vitalsHistoryReport = async (req, res, next) => {
  try {
    const { patientID }  = req.params;
    const { from, to }   = req.query;

    const [data, hospitalName] = await Promise.all([
      reportService.getVitalsHistoryData(patientID, { from, to }),
      getHospitalName(req.user.hospitalId),
    ]);

    // Build a descriptive filename including the date range if provided
    const range    = from || to ? `_${from ?? ""}_to_${to ?? ""}` : "";
    const filename = `swasthify-${patientID}-vitals${range}.pdf`;

    const doc = createDoc();
    streamPDF(res, doc, filename);

    buildVitalsHistory(doc, {
      ...data,
      from,
      to,
      generatedBy:  req.user.name,
      hospitalName,
    });

    doc.end();
  } catch (err) { next(err); }
};

module.exports = { patientSummaryReport, vitalsHistoryReport };
const prisma = require("../config/db");

/**
 * Generates a human-readable patient ID: PAT-2025-0042
 *
 * Uses a count-based approach which is fine for moderate scale.
 * For true concurrency safety at scale, you'd use a PostgreSQL sequence,
 * but this is sufficient for this system.
 */
const generatePatientID = async () => {
  const year  = new Date().getFullYear();
  const count = await prisma.patient.count();
  const padded = String(count + 1).padStart(4, "0");
  return `PAT-${year}-${padded}`;
};

/**
 * Generates a registration code for a hospital: HOSP-XXXXXX (random alphanumeric)
 * Staff use this code to register under the hospital.
 */
const generateRegistrationCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O,0,I,1 to avoid confusion
  let code = "HOSP-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

module.exports = { generatePatientID, generateRegistrationCode };
const bcrypt = require("bcryptjs");
const prisma = require("../config/db");
const { generatePatientID } = require("../utils/idGen");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const { saveRefreshToken } = require("../config/redis");

/**
 * Self-registration for patients.
 * Generates a unique patientID automatically — patients don't pick their own.
 */
const registerPatient = async ({ name, dob, bloodGroup, gender, phone, password }) => {
  // Check if phone is already registered (if provided)
  if (phone) {
    const existing = await prisma.patient.findFirst({ where: { phone } });
    if (existing) {
      throw { status: 409, message: "This phone number is already registered." };
    }
  }

  const patientID   = await generatePatientID();
  const passwordHash = await bcrypt.hash(password, 12);

  const patient = await prisma.patient.create({
    data: {
      patientID,
      name,
      dob: new Date(dob),
      bloodGroup,
      gender,
      phone,
      passwordHash,
    },
    select: {
      id: true, patientID: true, name: true,
      dob: true, bloodGroup: true, gender: true,
      phone: true, createdAt: true,
    },
  });

  return patient;
};

/**
 * Patient login — by patientID + password.
 */
const loginPatient = async ({ patientID, password }) => {
  const patient = await prisma.patient.findUnique({ where: { patientID } });
  if (!patient) throw { status: 401, message: "Invalid credentials." };

  const match = await bcrypt.compare(password, patient.passwordHash);
  if (!match) throw { status: 401, message: "Invalid credentials." };

  const payload = {
    id:        patient.id,
    type:      "patient",
    patientID: patient.patientID,
    name:      patient.name,
  };

  const accessToken  = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  await saveRefreshToken(patient.id, refreshToken);

  return {
    accessToken,
    refreshToken,
    patient: {
      id:        patient.id,
      patientID: patient.patientID,
      name:      patient.name,
      bloodGroup: patient.bloodGroup,
    },
  };
};

module.exports = { registerPatient, loginPatient };
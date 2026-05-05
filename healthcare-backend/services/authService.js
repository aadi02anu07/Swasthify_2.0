const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Staff = require("../db/models/Staff");
const Patient = require("../db/models/Patient");

// ── Token Helper ───────────────────────────────────────────────────────────

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// ── Staff ──────────────────────────────────────────────────────────────────

const registerStaff = async ({ staffID, name, role, password }) => {
  if (!staffID || !name || !role || !password) {
    throw { status: 400, message: "All fields are required" };
  }

  const existing = await Staff.findOne({ staffID });
  if (existing) {
    throw { status: 400, message: "Staff ID already in use" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const staff = new Staff({ staffID, name, role, password: hashedPassword });
  await staff.save();

  return { message: "Staff registered successfully!" };
};

const loginStaff = async ({ staffID, password }) => {
  const staff = await Staff.findOne({ staffID });
  if (!staff) {
    throw { status: 401, message: "Invalid credentials" };
  }

  const isValid = await bcrypt.compare(password, staff.password);
  if (!isValid) {
    throw { status: 401, message: "Invalid credentials" };
  }

  const token = generateToken({
    id: staff._id,
    staffID: staff.staffID,
    role: staff.role,   // "doctor" | "nurse"
    type: "staff",
  });

  return {
    message: "Login successful",
    token,
    staff: { staffID: staff.staffID, name: staff.name, role: staff.role },
  };
};

// ── Patient ────────────────────────────────────────────────────────────────

const registerPatient = async ({ name, age, bp, sugar, heartRate, patientID, password }) => {
  if (!name || !age || !bp || !sugar || !heartRate || !patientID || !password) {
    throw { status: 400, message: "All fields are required" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const patient = new Patient({ name, age, bp, sugar, heartRate, patientID, password: hashedPassword });
  await patient.save();

  return { message: "Patient registered successfully!" };
};

const loginPatient = async ({ patientID, password }) => {
  const patient = await Patient.findOne({ patientID });
  if (!patient) {
    throw { status: 401, message: "Invalid credentials" };
  }

  const isValid = await bcrypt.compare(password, patient.password);
  if (!isValid) {
    throw { status: 401, message: "Invalid credentials" };
  }

  const token = generateToken({
    id: patient._id,
    patientID: patient.patientID,
    type: "patient",
  });

  return {
    message: "Login successful",
    token,
    patient: {
      patientID: patient.patientID,
      name: patient.name,
      age: patient.age,
    },
  };
};

module.exports = { registerStaff, loginStaff, registerPatient, loginPatient };
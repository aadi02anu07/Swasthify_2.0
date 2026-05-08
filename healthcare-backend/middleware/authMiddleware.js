const { verifyAccessToken } = require("../utils/jwt");

/**
 * Verifies the JWT access token from the Authorization header.
 * Attaches decoded payload to req.user.
 *
 * Token payload shape:
 *   Staff:    { id, type: "staff",    role: "doctor"|"nurse"|"admin", hospitalId, name }
 *   Patient:  { id, type: "patient",  patientID, name }
 *   Hospital: { id, type: "hospital", name }
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access token required." });
  }

  const token = authHeader.split(" ")[1];
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired access token." });
  }
};

// ── Role Guards ───────────────────────────────────────────────────────────────

/** Any staff member (doctor, nurse, admin) */
const staffOnly = (req, res, next) => {
  if (req.user?.type !== "staff") {
    return res.status(403).json({ error: "Staff access only." });
  }
  next();
};

/** Doctors only */
const doctorOnly = (req, res, next) => {
  if (req.user?.type !== "staff" || req.user?.role !== "doctor") {
    return res.status(403).json({ error: "Doctor access only." });
  }
  next();
};

/** Nurses and doctors (clinical staff) */
const clinicalStaffOnly = (req, res, next) => {
  const role = req.user?.role;
  if (req.user?.type !== "staff" || !["doctor", "nurse"].includes(role)) {
    return res.status(403).json({ error: "Clinical staff access only." });
  }
  next();
};

/** Hospital admin (staff with role=admin OR hospital-level token) */
const hospitalAdminOnly = (req, res, next) => {
  const isHospitalAccount = req.user?.type === "hospital";
  const isAdminStaff      = req.user?.type === "staff" && req.user?.role === "admin";
  if (!isHospitalAccount && !isAdminStaff) {
    return res.status(403).json({ error: "Hospital admin access only." });
  }
  next();
};

/** Patients only */
const patientOnly = (req, res, next) => {
  if (req.user?.type !== "patient") {
    return res.status(403).json({ error: "Patient access only." });
  }
  next();
};

/**
 * Staff can only act within their own hospital.
 * Pass this AFTER verifyToken + staffOnly.
 * Usage: route param must be :hospitalId
 */
const sameHospitalOnly = (req, res, next) => {
  if (req.user?.type === "hospital") return next(); // hospital-level token passes
  if (req.user?.hospitalId !== req.params.hospitalId) {
    return res.status(403).json({ error: "You can only access records within your hospital." });
  }
  next();
};

module.exports = {
  verifyToken,
  staffOnly,
  doctorOnly,
  clinicalStaffOnly,
  hospitalAdminOnly,
  patientOnly,
  sameHospitalOnly,
};
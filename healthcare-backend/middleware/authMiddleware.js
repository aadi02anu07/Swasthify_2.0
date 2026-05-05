const jwt = require("jsonwebtoken");

/**
 * verifyToken
 * Checks that the request carries a valid JWT.
 * Attaches the decoded payload to req.user for downstream use.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // { id, staffID/patientID, role, type }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};

/**
 * staffOnly
 * Use after verifyToken. Blocks patients from staff-only routes.
 */
const staffOnly = (req, res, next) => {
  if (req.user?.type !== "staff") {
    return res.status(403).json({ error: "Access denied. Staff only." });
  }
  next();
};

/**
 * doctorOnly
 * Use after verifyToken. Restricts to doctors only (e.g. delete patient).
 */
const doctorOnly = (req, res, next) => {
  if (req.user?.role !== "doctor") {
    return res.status(403).json({ error: "Access denied. Doctors only." });
  }
  next();
};

module.exports = { verifyToken, staffOnly, doctorOnly };
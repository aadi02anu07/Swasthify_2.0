const hospitalAuthService = require("../services/hospitalAuthService");
const staffAuthService    = require("../services/staffAuthService");
const patientAuthService  = require("../services/patientAuthService");
const { verifyRefreshToken, generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const { getRefreshToken, saveRefreshToken, deleteRefreshToken } = require("../config/redis");

// ── Cookie helper ─────────────────────────────────────────────────────────────
// sameSite:"strict" silently blocks cookies on cross-origin requests
// (Vercel → Render). Must use "none" + secure:true in production.
const isProd = process.env.NODE_ENV === "production";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   isProd,
  sameSite: isProd ? "none" : "lax",
  maxAge:   30 * 24 * 60 * 60 * 1000, // 30 days in ms
};

// ── Hospital ──────────────────────────────────────────────────────────────────

const registerHospital = async (req, res, next) => {
  try {
    const hospital = await hospitalAuthService.registerHospital(req.body);
    res.status(201).json({
      message: "Hospital registered successfully. Share your registrationCode with your staff.",
      hospital,
    });
  } catch (err) { next(err); }
};

const loginHospital = async (req, res, next) => {
  try {
    const result = await hospitalAuthService.loginHospital(req.body);
    res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
    res.status(200).json({
      accessToken:  result.accessToken,
      refreshToken: result.refreshToken,
      hospital:     result.hospital,
    });
  } catch (err) { next(err); }
};

// ── Staff ─────────────────────────────────────────────────────────────────────

const registerStaff = async (req, res, next) => {
  try {
    const staff = await staffAuthService.registerStaff(req.body);
    res.status(201).json({ message: "Staff registered successfully.", staff });
  } catch (err) { next(err); }
};

const loginStaff = async (req, res, next) => {
  try {
    const result = await staffAuthService.loginStaff(req.body);
    res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
    res.status(200).json({
      accessToken:  result.accessToken,
      refreshToken: result.refreshToken,
      staff:        result.staff,
    });
  } catch (err) { next(err); }
};

// ── Patient ───────────────────────────────────────────────────────────────────

const registerPatient = async (req, res, next) => {
  try {
    const patient = await patientAuthService.registerPatient(req.body);
    res.status(201).json({
      message: `Patient registered. Your patient ID is: ${patient.patientID}. Keep it safe — you will need it to log in.`,
      patient,
    });
  } catch (err) { next(err); }
};

const loginPatient = async (req, res, next) => {
  try {
    const result = await patientAuthService.loginPatient(req.body);
    res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
    res.status(200).json({
      accessToken:  result.accessToken,
      refreshToken: result.refreshToken,
      patient:      result.patient,
    });
  } catch (err) { next(err); }
};

// ── Token Refresh ─────────────────────────────────────────────────────────────

const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) throw { status: 401, message: "No refresh token provided." };

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      throw { status: 401, message: "Invalid or expired refresh token." };
    }

    const stored = await getRefreshToken(decoded.id);
    if (!stored || stored !== token) {
      throw { status: 401, message: "Refresh token has been revoked. Please log in again." };
    }

    const { iat, exp, ...payload } = decoded;
    const newAccessToken  = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    await saveRefreshToken(decoded.id, newRefreshToken);
    res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);

    res.status(200).json({
      accessToken:  newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) { next(err); }
};

// ── Logout ────────────────────────────────────────────────────────────────────

const logout = async (req, res, next) => {
  try {
    await deleteRefreshToken(req.user.id);
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Logged out successfully." });
  } catch (err) { next(err); }
};

module.exports = {
  registerHospital, loginHospital,
  registerStaff,    loginStaff,
  registerPatient,  loginPatient,
  refreshToken,     logout,
};
const express    = require("express");
const rateLimit  = require("express-rate-limit");
const router     = express.Router();

const { verifyToken, staffOnly } = require("../middleware/authMiddleware");
const aiCtrl                     = require("../controllers/aiController");

/**
 * AI endpoints get their own tight rate limiter — each call costs real tokens.
 * 10 requests per 15 minutes per IP is generous enough for clinical use
 * but prevents any single client from burning through the API quota.
 */
const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  { error: "AI analysis rate limit reached. Please wait before requesting another analysis." },
});

// All AI routes: must be authenticated + staff only
// Patients don't see raw AI output — the doctor interprets it for them
router.use(verifyToken, staffOnly, aiRateLimiter);

// Vitals-only analysis — faster, cheaper
router.post("/analyze/vitals/:patientID", aiCtrl.analyzeVitals);

// Full chart analysis — vitals + medical history
router.post("/analyze/chart/:patientID",  aiCtrl.analyzeFullChart);

module.exports = router;
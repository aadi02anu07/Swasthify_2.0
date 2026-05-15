const { GoogleGenerativeAI } = require("@google/generative-ai");
const prisma = require("../config/db");
const { cacheSet, cacheGet } = require("../config/redis");

// ── Gemini client ─────────────────────────────────────────────────────────────
// Initialised once, reused across all calls.
// gemini-1.5-flash: fastest model, generous free tier, sufficient for structured analysis.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest",
  generationConfig: {
    temperature:     0.2,
    topP:            0.8,
    maxOutputTokens: 2048,
  },
});

const AI_CACHE_TTL = 600; // 10 min — AI responses are expensive; cache aggressively

// ── Prompt builder ────────────────────────────────────────────────────────────

/**
 * Builds the system context injected into every Gemini call.
 * This framing is the most important safety layer in the whole feature.
 */
const SYSTEM_CONTEXT = `
You are a clinical decision support AI embedded in Swasthify, a multi-hospital patient health record network.
Your role is to help doctors by surfacing patterns in patient data — NOT to diagnose or prescribe.

STRICT RULES:
1. You are ASSISTING a qualified doctor, not replacing one.
2. Use clinical language appropriate for a healthcare professional audience.
3. Never state a diagnosis. Say "findings suggest" or "may indicate" instead.
4. Flag any pattern that warrants urgent attention — err on the side of caution.
5. Respond ONLY in valid JSON. No preamble, no markdown fences, no explanation outside the JSON.
6. If data is insufficient for a meaningful observation, say so clearly in the summary.
7. Keep ALL string values under 150 characters. Be concise.
8. The suggestionsForDoctor array must have a maximum of 4 items.
`.trim();

const RESPONSE_SCHEMA = `
{
  "disclaimer": "string — one sentence AI disclaimer",
  "summary": "string — 2-3 sentence clinical overview of the patient's current status",
  "observations": [
    {
      "category": "string (e.g. Blood Pressure, Heart Rate, Blood Sugar, SpO2, Temperature)",
      "finding": "string — specific clinical observation",
      "concern": "none | low | moderate | high"
    }
  ],
  "trends": {
    "heartRate":    "stable | improving | worsening | fluctuating | insufficient_data",
    "bloodPressure":"stable | improving | worsening | fluctuating | insufficient_data",
    "bloodSugar":   "stable | improving | worsening | fluctuating | insufficient_data",
    "spo2":         "stable | improving | worsening | fluctuating | insufficient_data",
    "temperature":  "stable | improving | worsening | fluctuating | insufficient_data"
  },
  "suggestionsForDoctor": ["array of concise, actionable clinical suggestions"],
  "urgency": "routine | follow-up-soon | urgent | critical",
  "urgencyReason": "string — one sentence explaining the urgency level"
}
`.trim();

// ── Internal helpers ──────────────────────────────────────────────────────────

const findPatient = async (patientID) => {
  const patient = await prisma.patient.findUnique({
    where: { patientID },
    select: { id: true, patientID: true, name: true, dob: true, bloodGroup: true, gender: true },
  });
  if (!patient) throw { status: 404, message: `Patient '${patientID}' not found.` };
  return patient;
};

/** Compute age without exposing it to the AI (no PII, just age in years) */
const computeAge = (dob) =>
  Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

/** Parse Gemini's response safely — strips any accidental markdown fences */
const parseGeminiJSON = (text) => {
  // Strip markdown fences
  let cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  // Find the first { and last } to extract just the JSON object
  const start = cleaned.indexOf("{");
  const end   = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  return JSON.parse(cleaned);
};

/**
 * Call Gemini with the given prompt and parse the structured JSON response.
 * Wraps the API call in a 25s Promise.race — Render free tier cold starts can
 * eat 15-20s, so without a timeout the request hangs until Render's hard 30s
 * kill and the client sees a generic 502. With Promise.race we get a clean 504.
 */
const GEMINI_TIMEOUT_MS = 25_000;

const callGemini = async (userPrompt) => {
  const fullPrompt = `${SYSTEM_CONTEXT}\n\n${userPrompt}\n\nRespond with this exact JSON schema:\n${RESPONSE_SCHEMA}`;

  const geminiCall   = model.generateContent(fullPrompt);
  const timeoutGuard = new Promise((_, reject) =>
    setTimeout(
      () => reject({ status: 504, message: "AI analysis timed out — the server is still waking up. Please try again in 30 seconds." }),
      GEMINI_TIMEOUT_MS
    )
  );

  let raw;
  try {
    const result = await Promise.race([geminiCall, timeoutGuard]);
    raw = result.response.text();
  } catch (err) {
    if (err.status) throw err; // re-throw our own structured errors (timeout)
    console.error("Gemini API error:", err.message);
    throw { status: 502, message: "AI service is temporarily unavailable. Please try again shortly." };
  }

  try {
    return parseGeminiJSON(raw);
  } catch {
    console.error("Gemini returned unparseable JSON. Raw response length:", raw?.length);
    console.error("First 500 chars:", raw?.slice(0, 500));
    throw { status: 502, message: "AI returned an unexpected response format. Please try again." };
  }
};

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Analyze a patient's recent vitals history.
 *
 * Sends the last 20 readings to Gemini with patient demographics (age, blood group).
 * No names, IDs, or hospital info — only clinical data reaches the AI.
 *
 * Cache key uses the timestamp of the latest vitals reading.
 * If no new vitals since last call → serve cache (zero API cost).
 */
const analyzeVitals = async (patientID) => {
  const patient = await findPatient(patientID);

  const readings = await prisma.vitalsHistory.findMany({
    where: { patientId: patient.id },
    orderBy: { recordedAt: "desc" },
    take: 20,
    select: {
      bpSystolic: true, bpDiastolic: true, heartRate: true,
      sugar: true, spo2: true, temperature: true, weight: true,
      recordedAt: true,
    },
  });

  if (readings.length === 0) {
    throw { status: 400, message: "No vitals data available. Record at least one reading before requesting AI analysis." };
  }

  // Cache key tied to the latest reading's timestamp
  // New reading → different timestamp → cache miss → fresh Gemini call
  const latestTs = readings[0].recordedAt.getTime();
  const cacheKey = `ai:vitals:${patient.id}:${latestTs}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return { patient: { patientID, name: patient.name }, analysis: cached, fromCache: true };

  const age = computeAge(patient.dob);

  // Build the data block sent to Gemini — clinical data only, no PII names
  const dataBlock = `
PATIENT DEMOGRAPHICS:
- Age: ${age} years
- Biological sex: ${patient.gender || "not specified"}
- Blood group: ${patient.bloodGroup || "not recorded"}

VITALS READINGS (${readings.length} readings, most recent first):
${readings.map((r, i) => `
Reading ${i + 1} — ${new Date(r.recordedAt).toISOString().slice(0, 10)}:
  BP: ${r.bpSystolic}/${r.bpDiastolic} mmHg
  Heart Rate: ${r.heartRate} bpm
  Blood Sugar: ${r.sugar} mg/dL
  SpO2: ${r.spo2 ?? "not recorded"}%
  Temperature: ${r.temperature ?? "not recorded"}°C
  Weight: ${r.weight ?? "not recorded"} kg`).join("\n")}

TASK: Analyze these vitals readings for trends, anomalies, and patterns that would be clinically relevant to a treating physician.
`.trim();

  const analysis = await callGemini(dataBlock);
  await cacheSet(cacheKey, analysis, AI_CACHE_TTL);

  return { patient: { patientID, name: patient.name }, analysis, fromCache: false };
};

/**
 * Full chart analysis — vitals history + medical history combined.
 *
 * This is the richer, slower analysis. It gives Gemini the complete picture:
 * past diagnoses, surgeries, allergies, medications alongside vitals trends.
 * Useful before a consultation or when a doctor inherits a patient from another hospital.
 */
const analyzeFullChart = async (patientID) => {
  const patient = await findPatient(patientID);

  const [readings, medicalHistory] = await Promise.all([
    prisma.vitalsHistory.findMany({
      where: { patientId: patient.id },
      orderBy: { recordedAt: "desc" },
      take: 15,
      select: {
        bpSystolic: true, bpDiastolic: true, heartRate: true,
        sugar: true, spo2: true, temperature: true, recordedAt: true,
      },
    }),
    prisma.medicalHistory.findMany({
      where: { patientId: patient.id },
      orderBy: { occurredAt: "desc" },
      take: 15,
      select: { title: true, type: true, description: true, severity: true, occurredAt: true },
    }),
  ]);

  if (readings.length === 0 && medicalHistory.length === 0) {
    throw { status: 400, message: "No patient data available for analysis." };
  }

  // Cache key uses timestamps of both latest vitals and latest medical record
  const latestVitalsTs = readings[0]?.recordedAt.getTime() ?? 0;
  const latestHistoryTs = medicalHistory[0]?.occurredAt.getTime() ?? 0;
  const cacheKey = `ai:chart:${patient.id}:${latestVitalsTs}:${latestHistoryTs}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return { patient: { patientID, name: patient.name }, analysis: cached, fromCache: true };

  const age = computeAge(patient.dob);

  const dataBlock = `
PATIENT DEMOGRAPHICS:
- Age: ${age} years
- Biological sex: ${patient.gender || "not specified"}
- Blood group: ${patient.bloodGroup || "not recorded"}

RECENT VITALS (${readings.length} readings, most recent first):
${readings.length > 0
      ? readings.map((r, i) => `
Reading ${i + 1} — ${new Date(r.recordedAt).toISOString().slice(0, 10)}:
  BP: ${r.bpSystolic}/${r.bpDiastolic} mmHg | HR: ${r.heartRate} bpm | Sugar: ${r.sugar} mg/dL | SpO2: ${r.spo2 ?? "N/A"}% | Temp: ${r.temperature ?? "N/A"}°C`).join("\n")
      : "No vitals recorded."}

MEDICAL HISTORY (${medicalHistory.length} records, most recent first):
${medicalHistory.length > 0
      ? medicalHistory.map((h, i) => `
Record ${i + 1} — ${new Date(h.occurredAt).toISOString().slice(0, 10)} [${h.type.toUpperCase()}]${h.severity ? ` — Severity: ${h.severity}` : ""}:
  ${h.title}: ${h.description}`).join("\n")
      : "No medical history recorded."}

TASK: Provide a comprehensive clinical assessment. Consider how the medical history context may explain or inform the vitals patterns. Highlight any interactions between past conditions and current readings that a treating physician should be aware of.
`.trim();

  const analysis = await callGemini(dataBlock);
  await cacheSet(cacheKey, analysis, AI_CACHE_TTL);

  return { patient: { patientID, name: patient.name }, analysis, fromCache: false };
};

module.exports = { analyzeVitals, analyzeFullChart };
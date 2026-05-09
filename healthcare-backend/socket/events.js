/**
 * All Socket.IO event names in one place.
 * Import this in both the server (socket/index.js) and controllers.
 *
 * Convention:
 *   SERVER_TO_CLIENT — what the server emits to clients
 *   CLIENT_TO_SERVER — what clients send to the server
 */

const EVENTS = {
  // ── Server → Client ────────────────────────────────────────────────────────
  // Vitals
  VITALS_NEW:           "vitals:new",          // new reading recorded
  VITALS_CRITICAL:      "vitals:critical",     // one or more critical anomalies

  // Medical history
  HISTORY_NEW:          "history:new",         // new medical record added

  // Appointments
  APPOINTMENT_UPDATED:  "appointment:updated", // status changed

  // General
  NOTIFICATION:         "notification",        // generic notification push
  ERROR:                "socket:error",        // server-sent error on the socket

  // Acknowledgements
  JOINED_PATIENT:       "joined:patient",
  JOINED_HOSPITAL:      "joined:hospital",

  // ── Client → Server ────────────────────────────────────────────────────────
  JOIN_PATIENT:         "join:patient",
  LEAVE_PATIENT:        "leave:patient",
  JOIN_HOSPITAL:        "join:hospital",
  LEAVE_HOSPITAL:       "leave:hospital",
};

module.exports = EVENTS;
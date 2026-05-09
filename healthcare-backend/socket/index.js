const { Server }          = require("socket.io");
const { verifyAccessToken } = require("../utils/jwt");
const prisma              = require("../config/db");
const EVENTS              = require("./events");

/**
 * Sets up Socket.IO on the given HTTP server.
 * Returns the io instance so server.js can attach it to the Express app.
 *
 * Room naming convention:
 *   patient:{patientID}      — live vitals + history updates for one patient
 *   hospital:{hospitalId}    — hospital-wide alerts (e.g. multiple critical patients)
 *   staff:{staffId}          — personal notifications for one staff member
 *   patient-self:{patientId} — patient's own notification channel
 */
const setupSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin:      process.env.FRONTEND_URL || "*",
      methods:     ["GET", "POST"],
      credentials: true,
    },
    // Ping every 25s, disconnect after 60s of no response.
    // Keeps mobile clients from holding dead connections.
    pingInterval: 25000,
    pingTimeout:  60000,
  });

  // ── Auth Middleware ─────────────────────────────────────────────────────────
  // Runs before "connection" fires. Rejects unauthenticated clients entirely.
  // Client must send: socket = io(URL, { auth: { token: "Bearer ..." } })
  io.use((socket, next) => {
    try {
      const raw = socket.handshake.auth?.token
        || socket.handshake.headers?.authorization;

      if (!raw) return next(new Error("Authentication required."));

      const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;
      const user  = verifyAccessToken(token);

      // Attach user payload to socket for use in all handlers
      socket.data.user = user;
      next();
    } catch {
      next(new Error("Invalid or expired token. Please log in again."));
    }
  });

  // ── Connection Handler ──────────────────────────────────────────────────────
  io.on("connection", (socket) => {
    const user = socket.data.user;

    console.log(
      `🔌 Connected  [${socket.id}] — ${user.type}: ${user.name || user.patientID}`
    );

    // ── Auto-join personal rooms on connect ──
    // Every connected user joins their own private channel immediately.
    // No client-side join event needed for personal notifications.
    if (user.type === "staff") {
      socket.join(`staff:${user.id}`);
      socket.join(`hospital:${user.hospitalId}`); // hospital-wide alerts
      console.log(
        `   ↳ Auto-joined staff:${user.id} + hospital:${user.hospitalId}`
      );
    } else if (user.type === "patient") {
      socket.join(`patient-self:${user.id}`);
      console.log(`   ↳ Auto-joined patient-self:${user.id}`);
    } else if (user.type === "hospital") {
      socket.join(`hospital:${user.id}`);
      console.log(`   ↳ Auto-joined hospital:${user.id}`);
    }

    // ── join:patient ──────────────────────────────────────────────────────────
    // Client requests to watch a specific patient's live feed.
    // Staff: can watch any patient.
    // Patient: can only watch themselves.
    socket.on(EVENTS.JOIN_PATIENT, async (patientID) => {
      try {
        if (!patientID || typeof patientID !== "string") {
          return socket.emit(EVENTS.ERROR, { message: "Invalid patientID." });
        }

        // Access control
        if (user.type === "patient") {
          // Patients may only join their own room
          if (user.patientID !== patientID) {
            return socket.emit(EVENTS.ERROR, {
              message: "You can only view your own records.",
            });
          }
        } else if (user.type === "staff") {
          // Verify the patient actually exists before joining
          // (prevents staff from subscribing to garbage room names)
          const exists = await prisma.patient.count({ where: { patientID } });
          if (!exists) {
            return socket.emit(EVENTS.ERROR, {
              message: `Patient '${patientID}' not found.`,
            });
          }
        } else {
          return socket.emit(EVENTS.ERROR, { message: "Access denied." });
        }

        socket.join(`patient:${patientID}`);
        socket.emit(EVENTS.JOINED_PATIENT, { patientID });
        console.log(`   ↳ ${user.name || user.patientID} joined patient:${patientID}`);
      } catch (err) {
        console.error("join:patient error:", err);
        socket.emit(EVENTS.ERROR, { message: "Failed to join room." });
      }
    });

    // ── leave:patient ─────────────────────────────────────────────────────────
    socket.on(EVENTS.LEAVE_PATIENT, (patientID) => {
      socket.leave(`patient:${patientID}`);
      console.log(
        `   ↳ ${user.name || user.patientID} left patient:${patientID}`
      );
    });

    // ── join:hospital ─────────────────────────────────────────────────────────
    // Lets a hospital-admin dashboard subscribe to hospital-wide alerts.
    // Staff are auto-joined to their own hospital on connect, but a super-admin
    // viewer could join multiple hospitals with this event.
    socket.on(EVENTS.JOIN_HOSPITAL, async (hospitalId) => {
      try {
        // Only staff or hospital accounts may join a hospital room
        if (user.type === "patient") {
          return socket.emit(EVENTS.ERROR, { message: "Access denied." });
        }

        // Staff can only join their own hospital's room
        if (user.type === "staff" && user.hospitalId !== hospitalId) {
          return socket.emit(EVENTS.ERROR, {
            message: "You can only subscribe to your own hospital's alerts.",
          });
        }

        socket.join(`hospital:${hospitalId}`);
        socket.emit(EVENTS.JOINED_HOSPITAL, { hospitalId });
        console.log(`   ↳ ${user.name} joined hospital:${hospitalId}`);
      } catch (err) {
        socket.emit(EVENTS.ERROR, { message: "Failed to join hospital room." });
      }
    });

    // ── leave:hospital ────────────────────────────────────────────────────────
    socket.on(EVENTS.LEAVE_HOSPITAL, (hospitalId) => {
      socket.leave(`hospital:${hospitalId}`);
    });

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      console.log(
        `🔌 Disconnected [${socket.id}] — ${user.name || user.patientID} (${reason})`
      );
    });

    // ── Error (client-side transport errors) ──────────────────────────────────
    socket.on("error", (err) => {
      console.error(`Socket error [${socket.id}]:`, err.message);
    });
  });

  return io;
};

module.exports = setupSocket;
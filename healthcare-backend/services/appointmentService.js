const prisma = require("../config/db");
const { cacheSet, cacheGet, cacheDel } = require("../config/redis");

const SCHEDULE_CACHE_TTL = 120; // 2 min

// ── Status transition rules ───────────────────────────────────────────────────
// Defines which status changes are legal.
// completed and cancelled are terminal — nothing moves out of them.
const VALID_TRANSITIONS = {
  pending:   ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

// ── Internal helpers ──────────────────────────────────────────────────────────

const findPatient = async (patientID) => {
  const patient = await prisma.patient.findUnique({
    where:  { patientID },
    select: { id: true, patientID: true, name: true, phone: true },
  });
  if (!patient) throw { status: 404, message: `Patient '${patientID}' not found.` };
  return patient;
};

const findAppointment = async (appointmentId) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient:  { select: { id: true, patientID: true, name: true } },
      staff:    { select: { id: true, name: true, role: true } },
      hospital: { select: { id: true, name: true, city: true } },
    },
  });
  if (!appointment) throw { status: 404, message: "Appointment not found." };
  return appointment;
};

const bustScheduleCache = async (staffId, patientId) => {
  await Promise.all([
    cacheDel(`schedule:${staffId}`),
    cacheDel(`appointments:patient:${patientId}`),
  ]);
};

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Create a new appointment.
 * Staff from any hospital can book a patient with any doctor in their hospital.
 * Prevents double-booking the same doctor at the same time slot.
 */
const createAppointment = async (patientID, creatorStaffId, hospitalId, data) => {
  const { staffId, scheduledAt, reason, notes } = data;
  const patient = await findPatient(patientID);

  // Verify the target doctor exists and belongs to the same hospital
  const doctor = await prisma.staff.findFirst({
    where: { id: staffId, hospitalId, role: "doctor" },
    select: { id: true, name: true, role: true },
  });
  if (!doctor) {
    throw { status: 404, message: "Doctor not found in your hospital." };
  }

  const scheduledDate = new Date(scheduledAt);

  // Prevent double-booking: check if doctor already has an appointment
  // within 30 minutes of the requested slot
  const thirtyMin = 30 * 60 * 1000;
  const conflict = await prisma.appointment.findFirst({
    where: {
      staffId,
      status:      { in: ["pending", "confirmed"] },
      scheduledAt: {
        gte: new Date(scheduledDate.getTime() - thirtyMin),
        lte: new Date(scheduledDate.getTime() + thirtyMin),
      },
    },
  });
  if (conflict) {
    throw {
      status: 409,
      message: `${doctor.name} already has an appointment within 30 minutes of this time slot. Please choose a different time.`,
    };
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId:  patient.id,
      hospitalId,
      staffId,
      scheduledAt: scheduledDate,
      reason:      reason || null,
      notes:       notes  || null,
    },
    include: {
      patient:  { select: { id: true, patientID: true, name: true } },
      staff:    { select: { id: true, name: true, role: true } },
      hospital: { select: { name: true, city: true } },
    },
  });

  await bustScheduleCache(staffId, patient.id);

  return { appointment, patient };
};

/**
 * Get all appointments for a hospital.
 * Filterable by status, date, and specific doctor.
 * Used for the hospital's appointment management dashboard.
 */
const getHospitalAppointments = async (hospitalId, { status, date, staffId, page = 1, limit = 20 } = {}) => {
  const take = Math.min(parseInt(limit), 100);
  const skip = (parseInt(page) - 1) * take;

  const where = { hospitalId };
  if (status)  where.status  = status;
  if (staffId) where.staffId = staffId;
  if (date) {
    const day   = new Date(date);
    const start = new Date(day.setHours(0, 0, 0, 0));
    const end   = new Date(day.setHours(23, 59, 59, 999));
    where.scheduledAt = { gte: start, lte: end };
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
      take,
      skip,
      include: {
        patient:  { select: { patientID: true, name: true, bloodGroup: true } },
        staff:    { select: { name: true, role: true } },
      },
    }),
    prisma.appointment.count({ where }),
  ]);

  return {
    appointments,
    pagination: {
      page: parseInt(page), limit: take, total,
      totalPages: Math.ceil(total / take),
      hasMore:    skip + take < total,
    },
  };
};

/**
 * Get a doctor's personal schedule.
 * Defaults to upcoming 7 days if no date range provided.
 * Cached — doctors check their schedule frequently.
 */
const getDoctorSchedule = async (staffId, { from, to } = {}) => {
  const cacheKey = `schedule:${staffId}`;
  const cached   = await cacheGet(cacheKey);
  if (cached) return { schedule: cached, fromCache: true };

  const now   = new Date();
  const start = from ? new Date(from) : now;
  const end   = to
    ? new Date(to)
    : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const appointments = await prisma.appointment.findMany({
    where: {
      staffId,
      status:      { in: ["pending", "confirmed"] },
      scheduledAt: { gte: start, lte: end },
    },
    orderBy: { scheduledAt: "asc" },
    include: {
      patient:  { select: { patientID: true, name: true, bloodGroup: true, gender: true } },
      hospital: { select: { name: true } },
    },
  });

  // Group by date for easy calendar rendering
  const grouped = {};
  for (const appt of appointments) {
    const dateKey = appt.scheduledAt.toISOString().slice(0, 10); // YYYY-MM-DD
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(appt);
  }

  const schedule = Object.keys(grouped)
    .sort()
    .map((date) => ({ date, appointments: grouped[date] }));

  await cacheSet(cacheKey, schedule, SCHEDULE_CACHE_TTL);
  return { schedule, fromCache: false };
};

/**
 * Get all appointments for a specific patient.
 * Used on the patient's own dashboard and on the patient chart (for staff).
 */
const getPatientAppointments = async (patientID, { status, from, to } = {}) => {
  const patient = await findPatient(patientID);
  const cacheKey = `appointments:patient:${patient.id}`;

  // Only cache when no filters are applied (the default view)
  const useCache = !status && !from && !to;
  if (useCache) {
    const cached = await cacheGet(cacheKey);
    if (cached) return { patient, appointments: cached, fromCache: true };
  }

  const where = { patientId: patient.id };
  if (status) where.status = status;
  if (from || to) {
    where.scheduledAt = {};
    if (from) where.scheduledAt.gte = new Date(from);
    if (to)   where.scheduledAt.lte = new Date(to);
  }

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { scheduledAt: "desc" },
    include: {
      staff:    { select: { name: true, role: true } },
      hospital: { select: { name: true, city: true } },
    },
  });

  if (useCache) await cacheSet(cacheKey, appointments, SCHEDULE_CACHE_TTL);

  return { patient, appointments, fromCache: false };
};

/**
 * Get a single appointment.
 * Access check: staff can see any appointment in their hospital,
 * patients can only see their own.
 */
const getAppointment = async (appointmentId, requestingUser) => {
  const appointment = await findAppointment(appointmentId);

  if (requestingUser.type === "patient") {
    if (appointment.patient.patientID !== requestingUser.patientID) {
      throw { status: 403, message: "You can only view your own appointments." };
    }
  } else if (requestingUser.type === "staff") {
    if (appointment.hospital.id !== requestingUser.hospitalId) {
      throw { status: 403, message: "This appointment belongs to a different hospital." };
    }
  }

  return { appointment };
};

/**
 * Update appointment status.
 * Enforces the state machine: only valid transitions are allowed.
 * Only staff from the creating hospital can update.
 * Optional notes field lets doctors add post-appointment observations.
 */
const updateStatus = async (appointmentId, staffId, hospitalId, { status, notes }) => {
  const appointment = await findAppointment(appointmentId);

  if (appointment.hospitalId !== hospitalId) {
    throw { status: 403, message: "You can only update appointments from your hospital." };
  }

  const allowed = VALID_TRANSITIONS[appointment.status];
  if (!allowed.includes(status)) {
    throw {
      status: 400,
      message: `Cannot move appointment from '${appointment.status}' to '${status}'. Allowed transitions: ${allowed.join(", ") || "none (terminal status)"}.`,
    };
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status,
      ...(notes !== undefined && { notes }),
    },
    include: {
      patient:  { select: { id: true, patientID: true, name: true } },
      staff:    { select: { id: true, name: true, role: true } },
      hospital: { select: { name: true } },
    },
  });

  await bustScheduleCache(updated.staffId, updated.patientId);

  return { appointment: updated };
};

/**
 * Cancel an appointment.
 * Staff from the creating hospital OR the patient themselves can cancel,
 * but only if the appointment is still pending or confirmed.
 */
const cancelAppointment = async (appointmentId, requestingUser) => {
  const appointment = await findAppointment(appointmentId);

  // Terminal status check
  if (!["pending", "confirmed"].includes(appointment.status)) {
    throw {
      status: 400,
      message: `Cannot cancel an appointment that is already '${appointment.status}'.`,
    };
  }

  // Access check
  if (requestingUser.type === "patient") {
    if (appointment.patient.patientID !== requestingUser.patientID) {
      throw { status: 403, message: "You can only cancel your own appointments." };
    }
  } else if (requestingUser.type === "staff") {
    if (appointment.hospitalId !== requestingUser.hospitalId) {
      throw { status: 403, message: "You can only cancel appointments from your hospital." };
    }
  }

  const cancelled = await prisma.appointment.update({
    where: { id: appointmentId },
    data:  { status: "cancelled" },
    include: {
      patient:  { select: { id: true, patientID: true, name: true } },
      staff:    { select: { id: true, name: true, role: true } },
      hospital: { select: { name: true } },
    },
  });

  await bustScheduleCache(cancelled.staffId, cancelled.patientId);

  return { appointment: cancelled };
};

module.exports = {
  createAppointment,
  getHospitalAppointments,
  getDoctorSchedule,
  getPatientAppointments,
  getAppointment,
  updateStatus,
  cancelAppointment,
};
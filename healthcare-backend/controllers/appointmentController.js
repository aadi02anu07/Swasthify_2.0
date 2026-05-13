const appointmentService = require("../services/appointmentService");
const notifier = require("../socket/notifier");

/**
 * POST /api/appointments
 * Clinical staff books an appointment for a patient with a doctor.
 */
const createAppointment = async (req, res, next) => {
  try {
    const { patientID } = req.body;
    const { appointment, patient } = await appointmentService.createAppointment(
      patientID, req.user.id, req.user.hospitalId, req.body
    );

    const io = req.app.get("io");

    // Notify the patient their appointment was booked
    notifier.notify(io, {
      userId: patient.id,
      userType: "patient",
      title: "Appointment Booked",
      message: `Your appointment with ${appointment.staff.name} is scheduled for ${new Date(appointment.scheduledAt).toLocaleString()}.`,
      type: "success",
      data: { appointmentId: appointment.id },
    });

    // Notify the doctor a new appointment is in their schedule
    notifier.notify(io, {
      userId: appointment.staffId,
      userType: "staff",
      title: "New Appointment",
      message: `Appointment booked with patient ${patient.patientID} at ${new Date(appointment.scheduledAt).toLocaleString()}.`,
      type: "info",
      data: { appointmentId: appointment.id },
    });

    res.status(201).json({
      message: "Appointment created successfully.",
      appointment,
    });
  } catch (err) { next(err); }
};

/**
 * GET /api/appointments/hospital
 * All appointments for the requesting staff's hospital.
 * Query: status, date (YYYY-MM-DD), staffId, page, limit
 */
const getHospitalAppointments = async (req, res, next) => {
  try {
    // Patients cannot access this endpoint
    if (req.user.type === "patient") {
      return res.status(403).json({ error: "Access denied." })
    }

    const { status, date, staffId, page, limit } = req.query

    // Hospital account: id IS the hospitalId
    // Staff account: hospitalId is a separate field
    const hospitalId = req.user.type === "hospital"
      ? req.user.id
      : req.user.hospitalId

    const result = await appointmentService.getHospitalAppointments(
      hospitalId, { status, date, staffId, page, limit }
    )
    res.status(200).json(result)
  } catch (err) { next(err) }
}

/**
 * GET /api/appointments/schedule
 * The requesting doctor's own upcoming schedule, grouped by date.
 * Query: from, to
 */
const getDoctorSchedule = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const result = await appointmentService.getDoctorSchedule(req.user.id, { from, to });
    res.status(200).json(result);
  } catch (err) { next(err); }
};

/**
 * GET /api/appointments/patient/:patientID
 * All appointments for a specific patient.
 * Accessible by staff (any) or the patient themselves.
 * Query: status, from, to
 */
const getPatientAppointments = async (req, res, next) => {
  try {
    const { patientID } = req.params;
    const { status, from, to } = req.query;

    // Patients can only view their own appointments
    if (req.user.type === "patient" && req.user.patientID !== patientID) {
      return res.status(403).json({ error: "You can only view your own appointments." });
    }

    const result = await appointmentService.getPatientAppointments(patientID, { status, from, to });
    res.status(200).json(result);
  } catch (err) { next(err); }
};

/**
 * GET /api/appointments/:id
 * Single appointment detail.
 */
const getAppointment = async (req, res, next) => {
  try {
    const result = await appointmentService.getAppointment(req.params.id, req.user);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

/**
 * PATCH /api/appointments/:id/status
 * Update appointment status (pending → confirmed → completed | cancelled).
 * Staff only. Notifies patient on every status change.
 */
const updateStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const { appointment } = await appointmentService.updateStatus(
      req.params.id, req.user.id, req.user.hospitalId, { status, notes }
    );

    const io = req.app.get("io");

    // Status-aware notification messages
    const messages = {
      confirmed: `Your appointment with ${appointment.staff.name} on ${new Date(appointment.scheduledAt).toLocaleDateString()} has been confirmed.`,
      completed: `Your appointment with ${appointment.staff.name} is marked as completed.`,
      cancelled: `Your appointment with ${appointment.staff.name} on ${new Date(appointment.scheduledAt).toLocaleDateString()} has been cancelled.`,
    };

    notifier.appointmentUpdated(io, {
      patientID: appointment.patient.patientID,
      patientDbId: appointment.patient.id,
      staffId: appointment.staffId,
      appointment,
    });

    notifier.notify(io, {
      userId: appointment.patient.id,
      userType: "patient",
      title: `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: messages[status] || `Your appointment status has changed to ${status}.`,
      type: status === "cancelled" ? "warning" : "success",
      data: { appointmentId: appointment.id },
    });

    res.status(200).json({ message: `Appointment marked as ${status}.`, appointment });
  } catch (err) { next(err); }
};

/**
 * DELETE /api/appointments/:id
 * Cancel an appointment. Staff or the patient can cancel.
 */
const cancelAppointment = async (req, res, next) => {
  try {
    const { appointment } = await appointmentService.cancelAppointment(req.params.id, req.user);

    const io = req.app.get("io");

    notifier.appointmentUpdated(io, {
      patientID: appointment.patient.patientID,
      patientDbId: appointment.patient.id,
      staffId: appointment.staffId,
      appointment,
    });

    // Notify whoever didn't initiate the cancellation
    if (req.user.type === "patient") {
      // Patient cancelled → notify the doctor
      notifier.notify(io, {
        userId: appointment.staffId,
        userType: "staff",
        title: "Appointment Cancelled",
        message: `Patient ${appointment.patient.name} cancelled their appointment on ${new Date(appointment.scheduledAt).toLocaleDateString()}.`,
        type: "warning",
        data: { appointmentId: appointment.id },
      });
    } else {
      // Staff cancelled → notify the patient
      notifier.notify(io, {
        userId: appointment.patient.id,
        userType: "patient",
        title: "Appointment Cancelled",
        message: `Your appointment with ${appointment.staff.name} on ${new Date(appointment.scheduledAt).toLocaleDateString()} has been cancelled by the hospital.`,
        type: "warning",
        data: { appointmentId: appointment.id },
      });
    }

    res.status(200).json({ message: "Appointment cancelled.", appointment });
  } catch (err) { next(err); }
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
import api from './axios'

export const createAppointment = (data) =>
  api.post('/api/appointments', data)

export const getHospitalAppointments = (params = {}) =>
  api.get('/api/appointments/hospital', { params })

export const getDoctorSchedule = (params = {}) =>
  api.get('/api/appointments/schedule', { params })

export const getPatientAppointments = (patientID, params = {}) =>
  api.get(`/api/appointments/patient/${patientID}`, { params })

export const updateAppointmentStatus = (id, status, notes) =>
  api.patch(`/api/appointments/${id}/status`, { status, notes })

export const cancelAppointment = (id) =>
  api.delete(`/api/appointments/${id}`)

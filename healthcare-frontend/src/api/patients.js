import api from './axios'

export const getPatientSummary = (patientID) =>
  api.get(`/api/patients/${patientID}/summary`)

export const searchPatientsByName = (name, limit = 10) =>
  api.get('/api/patients/search', { params: { name, limit } })

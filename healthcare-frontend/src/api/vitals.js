import api from './axios'

export const recordVitals = (patientID, data) =>
  api.post(`/api/patients/${patientID}/vitals`, data)

export const getLatestVitals = (patientID) =>
  api.get(`/api/patients/${patientID}/vitals/latest`)

export const getVitalsHistory = (patientID, params = {}) =>
  api.get(`/api/patients/${patientID}/vitals/history`, { params })

export const getVitalsSummary = (patientID) =>
  api.get(`/api/patients/${patientID}/vitals/summary`)

import api from './axios'

export const addMedicalRecord = (patientID, data) =>
  api.post(`/api/patients/${patientID}/history`, data)

export const getMedicalHistory = (patientID, params = {}) =>
  api.get(`/api/patients/${patientID}/history`, { params })

export const getHistoryTimeline = (patientID) =>
  api.get(`/api/patients/${patientID}/history/timeline`)

export const getSingleRecord = (patientID, recordId) =>
  api.get(`/api/patients/${patientID}/history/${recordId}`)

export const updateRecord = (patientID, recordId, data) =>
  api.patch(`/api/patients/${patientID}/history/${recordId}`, data)

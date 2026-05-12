import api from './axios'

export const getPatientSummary = (patientID) =>
  api.get(`/api/patients/${patientID}/summary`)

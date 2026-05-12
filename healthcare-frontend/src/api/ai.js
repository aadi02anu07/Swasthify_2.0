import api from './axios'

export const analyzeVitals = (patientID) =>
  api.post(`/api/ai/analyze/vitals/${patientID}`)

export const analyzeChart = (patientID) =>
  api.post(`/api/ai/analyze/chart/${patientID}`)

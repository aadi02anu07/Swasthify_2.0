import api from './axios'

export const loginStaff = (staffID, password) =>
  api.post('/api/auth/staff/login', { staffID, password })

export const loginPatient = (patientID, password) =>
  api.post('/api/auth/patient/login', { patientID, password })

export const loginHospital = (email, password) =>
  api.post('/api/auth/hospital/login', { email, password })

export const registerPatient = (data) =>
  api.post('/api/auth/patient/register', data)

export const registerStaff = (data) =>
  api.post('/api/auth/staff/register', data)

export const registerHospital = (data) =>
  api.post('/api/auth/hospital/register', data)

export const logout = () =>
  api.post('/api/auth/logout')

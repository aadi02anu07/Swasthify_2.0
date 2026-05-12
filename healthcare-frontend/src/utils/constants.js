export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DOCTOR: '/doctor',
  PATIENT_CHART: (id) => `/doctor/patient/${id}`,
  SCHEDULE: '/doctor/schedule',
  PATIENT: '/patient',
  PATIENT_HISTORY: '/patient/history',
  ADMIN: '/admin',
}

export const NORMAL_RANGES = {
  heartRate: { min: 60, max: 100, criticalMin: 40, criticalMax: 150, unit: 'bpm' },
  bpSystolic: { min: 90, max: 140, criticalMin: 70, criticalMax: 180, unit: 'mmHg' },
  bpDiastolic: { min: 60, max: 90, criticalMin: 40, criticalMax: 120, unit: 'mmHg' },
  sugar: { min: 70, max: 140, criticalMin: 50, criticalMax: 300, unit: 'mg/dL' },
  spo2: { min: 95, max: 100, criticalMin: 90, criticalMax: 100, unit: '%' },
  temperature: { min: 36.1, max: 37.5, criticalMin: 35, criticalMax: 39.5, unit: '°C' },
}

export const RECORD_TYPES = [
  { value: 'diagnosis', label: 'Diagnosis' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'allergy', label: 'Allergy' },
  { value: 'medication', label: 'Medication' },
  { value: 'lab_result', label: 'Lab Result' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'imaging', label: 'Imaging' },
]

export const SEVERITY_LEVELS = [
  { value: 'mild', label: 'Mild' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' },
]

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export const APPOINTMENT_STATUSES = {
  pending: { label: 'Pending', color: 'amber' },
  confirmed: { label: 'Confirmed', color: 'blue' },
  completed: { label: 'Completed', color: 'emerald' },
  cancelled: { label: 'Cancelled', color: 'rose' },
}

import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute, PublicRoute } from '@/utils/roleGuard'
import AppLayout from '@/components/layout/AppLayout'

import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'

import DoctorDashboard from '@/pages/doctor/DoctorDashboard'
import PatientChart from '@/pages/doctor/PatientChart'
import SchedulePage from '@/pages/doctor/SchedulePage'

import PatientDashboard from '@/pages/patient/PatientDashboard'
import MyHistoryPage from '@/pages/patient/MyHistoryPage'

import HospitalDashboard from '@/pages/admin/HospitalDashboard'

import useAuthStore from '@/store/authStore'

const HomeRoute = () => {
  const { user } = useAuthStore()
  if (!user) return <HomePage />
  if (user.type === 'patient') return <Navigate to="/patient" replace />
  if (user.role === 'admin' || user.type === 'hospital') return <Navigate to="/admin" replace />
  return <Navigate to="/doctor" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/doctor" element={<ProtectedRoute allowedRoles={['staff', 'doctor', 'nurse']}><DoctorDashboard /></ProtectedRoute>} />
        <Route path="/doctor/patient/:patientID" element={<ProtectedRoute allowedRoles={['staff', 'doctor', 'nurse']}><PatientChart /></ProtectedRoute>} />
        <Route path="/doctor/schedule" element={<ProtectedRoute allowedRoles={['staff', 'doctor']}><SchedulePage /></ProtectedRoute>} />
        <Route path="/patient" element={<ProtectedRoute allowedRoles={['patient']}><PatientDashboard /></ProtectedRoute>} />
        <Route path="/patient/history" element={<ProtectedRoute allowedRoles={['patient']}><MyHistoryPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin', 'hospital', 'staff']}><HospitalDashboard /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

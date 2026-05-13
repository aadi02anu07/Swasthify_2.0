import { Navigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuthStore()

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles) {
    // Check both user.type AND user.role — hospital admins have type:"hospital", no role field
    const hasRole = allowedRoles.includes(user.type) || allowedRoles.includes(user.role)
    if (!hasRole) {
      if (user.type === 'patient') return <Navigate to="/patient" replace />
      if (user.type === 'hospital' || user.role === 'admin') return <Navigate to="/admin" replace />
      return <Navigate to="/doctor" replace />
    }
  }

  return children
}

export const PublicRoute = ({ children }) => {
  const { user } = useAuthStore()
  if (!user) return children
  if (user.type === 'patient') return <Navigate to="/patient" replace />
  if (user.type === 'hospital' || user.role === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to="/doctor" replace />
}
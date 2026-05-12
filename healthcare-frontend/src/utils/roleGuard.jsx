import { Navigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuthStore()

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles) {
    const userRoles = [user.type, user.role].filter(Boolean)
    const hasRole = allowedRoles.some(r => userRoles.includes(r))
    if (!hasRole) {
      if (user.type === 'patient') return <Navigate to="/patient" replace />
      if (user.role === 'admin' || user.type === 'hospital') return <Navigate to="/admin" replace />
      return <Navigate to="/doctor" replace />
    }
  }

  return children
}

export const PublicRoute = ({ children }) => {
  const { user } = useAuthStore()
  if (!user) return children
  if (user.type === 'patient') return <Navigate to="/patient" replace />
  if (user.role === 'admin' || user.type === 'hospital') return <Navigate to="/admin" replace />
  return <Navigate to="/doctor" replace />
}

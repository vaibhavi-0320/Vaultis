import { Navigate, useLocation } from 'react-router-dom'
import { clearAuthStorage, getToken } from '../lib/api'

export function ProtectedRoute({ children }) {
  const location = useLocation()
  const token = getToken()

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      clearAuthStorage()
      return <Navigate to="/login" replace state={{ from: location.pathname }} />
    }
  } catch {
    clearAuthStorage()
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}

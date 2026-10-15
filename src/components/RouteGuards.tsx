import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'

export const CHANGE_PASSWORD_PATH = '/change-password'

export function GuestRoute() {
  const token = useAuthStore((s) => s.accessToken)
  if (token) return <Navigate to="/" replace />
  return <Outlet />
}

export function ProtectedRoute() {
  const token = useAuthStore((s) => s.accessToken)
  const mustChangePassword = useAuthStore((s) => s.mustChangePassword)
  const location = useLocation()
  if (!token) return <Navigate to="/login" replace />
  // parolă provizorie: nimic altceva până nu e schimbată (serverul oricum refuză cu 403)
  if (mustChangePassword && location.pathname !== CHANGE_PASSWORD_PATH) {
    return <Navigate to={CHANGE_PASSWORD_PATH} replace />
  }
  if (!mustChangePassword && location.pathname === CHANGE_PASSWORD_PATH) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}

import { Route } from 'react-router-dom'
import {
  LoginPage,
  RegisterPage,
  ConfirmEmailPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from '../../pages/auth'
import { GuestRoute } from '../../components/RouteGuards'

// ─── Public Routes ─────────────────────────────────────────────────────────────
const PublicRoutes = () => {
  return (
    <Route element={<GuestRoute />}>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/confirm-email" element={<ConfirmEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
    </Route>
  )
}

export default PublicRoutes

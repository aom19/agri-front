import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from './pages/auth'
import { DashboardPage } from './pages/dashboard'
import { ProfilePage } from './pages/profile/ProfilePage'
import { GuestRoute, ProtectedRoute } from './components/RouteGuards'
import DashboardLayout from './layouts/DashboardLayout'
import AuthInitializer from './components/AuthInitializer'
import NotificationBar from './components/NotificationBar'

export default function App() {
  return (
    <BrowserRouter>
      <AuthInitializer />
      <NotificationBar />
      <Routes>
        {/* Rute publice (doar pentru utilizatori neautentificați) */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        </Route>

        {/* Rute protejate */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

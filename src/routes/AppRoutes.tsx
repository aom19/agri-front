import { Navigate, Route, Routes } from 'react-router-dom'
import AuthInitializer from '../components/AuthInitializer'
import NotificationBar from '../components/NotificationBar'
import { PrivateRoutes, PublicRoutes } from './components/'

export default function AppRoutes() {
  return (
    <>
      <AuthInitializer />
      <NotificationBar />
      <Routes>
        <PublicRoutes />
        <PrivateRoutes />

        {/* ─── Fallback ────────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

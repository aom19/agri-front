import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from '../pages/auth'
import { DashboardPage } from '../pages/dashboard'
import { ProfilePage } from '../pages/profile/ProfilePage'
import { GuestRoute, ProtectedRoute } from '../components/RouteGuards'
import { RequirePermission } from '../components/RequirePermission'
import DashboardLayout from '../layouts/DashboardLayout'
import AuthInitializer from '../components/AuthInitializer'
import NotificationBar from '../components/NotificationBar'
import ForbiddenPage from '../pages/ForbiddenPage'

// ─── Lazy pages ───────────────────────────────────────────────────────────────
const MachinesPage = lazy(() => import('../pages/machines/MachinesPage'))
const OperatorsPage = lazy(() => import('../pages/operators/OperatorsPage'))
const AssignmentsPage = lazy(() => import('../pages/assignments/AssignmentsPage'))
const UsersPage = lazy(() => import('../pages/admin/users/UsersPage'))
const RolesPage = lazy(() => import('../pages/admin/roles/RolesPage'))
const PermissionsPage = lazy(() => import('../pages/admin/permissions/PermissionsPage'))

function PageLoader() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
      <CircularProgress size={32} />
    </Box>
  )
}

export default function AppRoutes() {
  return (
    <>
      <AuthInitializer />
      <NotificationBar />
      <Routes>
        {/* ─── Public routes (guest only) ──────────────────────────────── */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        </Route>

        {/* ─── Protected routes (authenticated) ────────────────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Dashboard — no specific permission, all authenticated users */}
            <Route path="/" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/403" element={<ForbiddenPage />} />

            <Route
              path="/machines"
              element={
                <RequirePermission permission="machines:read">
                  <Suspense fallback={<PageLoader />}>
                    <MachinesPage />
                  </Suspense>
                </RequirePermission>
              }
            />
            <Route
              path="/operators"
              element={
                <RequirePermission permission="operators:read">
                  <Suspense fallback={<PageLoader />}>
                    <OperatorsPage />
                  </Suspense>
                </RequirePermission>
              }
            />
            <Route
              path="/assignments"
              element={
                <RequirePermission permission="assignments:read">
                  <Suspense fallback={<PageLoader />}>
                    <AssignmentsPage />
                  </Suspense>
                </RequirePermission>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RequirePermission permission="users:read">
                  <Suspense fallback={<PageLoader />}>
                    <UsersPage />
                  </Suspense>
                </RequirePermission>
              }
            />
            <Route
              path="/admin/roles"
              element={
                <RequirePermission permission="roles:read">
                  <Suspense fallback={<PageLoader />}>
                    <RolesPage />
                  </Suspense>
                </RequirePermission>
              }
            />
            <Route
              path="/admin/permissions"
              element={
                <RequirePermission permission="roles:read">
                  <Suspense fallback={<PageLoader />}>
                    <PermissionsPage />
                  </Suspense>
                </RequirePermission>
              }
            />
          </Route>
        </Route>

        {/* ─── Fallback ────────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

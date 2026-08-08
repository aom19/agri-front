import { lazy, Suspense } from 'react'
import { Route } from 'react-router-dom'
import { DashboardPage } from '../../pages/dashboard'
import { ProfilePage } from '../../pages/profile/ProfilePage'
import SettingsPage from '../../pages/settings/SettingsPage'
import { ProtectedRoute } from '../../components/RouteGuards'
import { RequirePermission } from '../../components/RequirePermission'
import DashboardLayout from '../../layouts/DashboardLayout'
import ForbiddenPage from '../../pages/ForbiddenPage'
import PageLoader from './PageLoader'

const MachinesPage = lazy(() => import('../../pages/machines/MachinesPage'))
const ResourcesPage = lazy(() => import('../../pages/resources/ResourcesPage'))
const StocksPage = lazy(() => import('../../pages/stocks/StocksPage'))
const ResourceTypesPage = lazy(() => import('../../pages/resource-types/ResourceTypesPage'))
const ImplementsPage = lazy(() => import('../../pages/implements/ImplementsPage'))
const FieldsPage = lazy(() => import('../../pages/fields/FieldsPage'))
const WeatherMapPage = lazy(() => import('../../pages/weather/WeatherMapPage'))
const OperatorsPage = lazy(() => import('../../pages/operators/OperatorsPage'))
const AssignmentsPage = lazy(() => import('../../pages/assignments/AssignmentsPage'))
const OperationTypesPage = lazy(() => import('../../pages/operations/OperationTypesPage'))
const OperationTemplatesPage = lazy(() => import('../../pages/operations/OperationTemplatesPage'))
const UsersPage = lazy(() => import('../../pages/admin/users/UsersPage'))
const RolesPage = lazy(() => import('../../pages/admin/roles/RolesPage'))
const PermissionsPage = lazy(() => import('../../pages/admin/permissions/PermissionsPage'))

// ─── Private Routes ─────────────────────────────────────────────────────────────
const PrivateRoutes = () => {
  return (
    <Route element={<ProtectedRoute />}>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/403" element={<ForbiddenPage />} />

        <Route
          path="/weather-map"
          element={
            <RequirePermission permission="fields:read">
              <Suspense fallback={<PageLoader />}>
                <WeatherMapPage />
              </Suspense>
            </RequirePermission>
          }
        />

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
          path="/resources"
          element={
            <RequirePermission permission="resources:read">
              <Suspense fallback={<PageLoader />}>
                <ResourcesPage />
              </Suspense>
            </RequirePermission>
          }
        />
        <Route
          path="/stocks"
          element={
            <RequirePermission permission="stock.view">
              <Suspense fallback={<PageLoader />}>
                <StocksPage />
              </Suspense>
            </RequirePermission>
          }
        />
        <Route
          path="/admin/resource-types"
          element={
            <RequirePermission permission="resources:read">
              <Suspense fallback={<PageLoader />}>
                <ResourceTypesPage />
              </Suspense>
            </RequirePermission>
          }
        />
        <Route
          path="/implements"
          element={
            <Suspense fallback={<PageLoader />}>
              <ImplementsPage />
            </Suspense>
          }
        />
        <Route
          path="/fields"
          element={
            <RequirePermission permission="fields:read">
              <Suspense fallback={<PageLoader />}>
                <FieldsPage />
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
          path="/operation-types"
          element={
            <RequirePermission permission="operations:read">
              <Suspense fallback={<PageLoader />}>
                <OperationTypesPage />
              </Suspense>
            </RequirePermission>
          }
        />
        <Route
          path="/operation-templates"
          element={
            <RequirePermission permission="operations:read">
              <Suspense fallback={<PageLoader />}>
                <OperationTemplatesPage />
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
  )
}

export default PrivateRoutes

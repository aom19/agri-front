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
const FieldOperationsPage = lazy(() => import('../../pages/field-operations/FieldOperationsPage'))
const FieldOperationDetailPage = lazy(
  () => import('../../pages/field-operations/FieldOperationDetailPage')
)
const FieldOperationFormPage = lazy(
  () => import('../../pages/field-operations/FieldOperationFormPage')
)
const UsersPage = lazy(() => import('../../pages/admin/users/UsersPage'))
const RolesPage = lazy(() => import('../../pages/admin/roles/RolesPage'))
const PermissionsPage = lazy(() => import('../../pages/admin/permissions/PermissionsPage'))
const NotificationsPage = lazy(() => import('../../pages/notifications/NotificationsPage'))
const AuditLogPage = lazy(() => import('../../pages/admin/audit/AuditLogPage'))
const ReportsPage = lazy(() => import('../../pages/reports/ReportsPage'))
const CropsPage = lazy(() => import('../../pages/crops/CropsPage'))

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
          path="/crops"
          element={
            <RequirePermission permission="crops:read">
              <Suspense fallback={<PageLoader />}>
                <CropsPage />
              </Suspense>
            </RequirePermission>
          }
        />
        <Route
          path="/reports"
          element={
            <RequirePermission permission="reports:read">
              <Suspense fallback={<PageLoader />}>
                <ReportsPage />
              </Suspense>
            </RequirePermission>
          }
        />

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
            <RequirePermission permission="implements:read">
              <Suspense fallback={<PageLoader />}>
                <ImplementsPage />
              </Suspense>
            </RequirePermission>
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
          path="/field-operations"
          element={
            <RequirePermission permission="field_operations:read">
              <Suspense fallback={<PageLoader />}>
                <FieldOperationsPage />
              </Suspense>
            </RequirePermission>
          }
        />
        <Route
          path="/field-operations/new"
          element={
            <RequirePermission permission="field_operations:write">
              <Suspense fallback={<PageLoader />}>
                <FieldOperationFormPage mode="create" />
              </Suspense>
            </RequirePermission>
          }
        />
        <Route
          path="/field-operations/:id/edit"
          element={
            <RequirePermission permission="field_operations:write">
              <Suspense fallback={<PageLoader />}>
                <FieldOperationFormPage mode="edit" />
              </Suspense>
            </RequirePermission>
          }
        />
        <Route
          path="/field-operations/:id"
          element={
            <RequirePermission permission="field_operations:read">
              <Suspense fallback={<PageLoader />}>
                <FieldOperationDetailPage />
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
        <Route
          path="/notifications"
          element={
            <RequirePermission permission="notifications:read">
              <Suspense fallback={<PageLoader />}>
                <NotificationsPage />
              </Suspense>
            </RequirePermission>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <RequirePermission permission="audit:read">
              <Suspense fallback={<PageLoader />}>
                <AuditLogPage />
              </Suspense>
            </RequirePermission>
          }
        />
      </Route>
    </Route>
  )
}

export default PrivateRoutes

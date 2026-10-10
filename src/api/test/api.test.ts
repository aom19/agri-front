import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AxiosResponse } from 'axios'
import { api } from '../axios'
import { auditApi } from '../audit.api'
import { authApi } from '../auth.api'
import { cropsApi } from '../crops.api'
import { dashboardApi } from '../dashboard.api'
import { fieldOperationsApi } from '../fieldOperation.api'
import { fieldsApi } from '../fields.api'
import { implementApi } from '../implement.api'
import { machineApi } from '../machine.api'
import { notificationsApi } from '../notifications.api'
import { operationApi } from '../operation.api'
import { operatorApi } from '../operator.api'
import { permissionsApi } from '../permissions.api'
import { profileApi } from '../profile.api'
import { reportsApi, reportsExtraApi } from '../reports.api'
import { resourceApi } from '../resource.api'
import { rolesApi } from '../roles.api'
import { stockMovementsApi } from '../stockMovement.api'
import { usersApi } from '../users.api'
import { weatherApi } from '../weather.api'

vi.mock('../axios', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete'
type Case = {
  name: string
  call: () => Promise<unknown>
  method: Method
  url: string
  /** argumentele așteptate după URL (payload / opțiuni) */
  args?: unknown[]
  /** ce întoarce wrapper-ul; implicit `data` din răspuns */
  expected?: unknown
  data?: unknown
}

const DATA = { ok: true }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyPayload = { x: 1 } as any

const cases: Case[] = [
  {
    name: 'audit.getAll',
    call: () => auditApi.getAll({ limit: 5 }),
    method: 'get',
    url: '/audit-log',
    args: [{ params: { limit: 5 } }],
  },

  {
    name: 'auth.login',
    call: () => authApi.login({ email: 'a', password: 'b' }),
    method: 'post',
    url: '/auth/login',
    args: [{ email: 'a', password: 'b' }],
    expected: { data: DATA, status: 200 },
  },
  {
    name: 'auth.register',
    call: () => authApi.register({ email: 'a', password: 'b' }),
    method: 'post',
    url: '/auth/register',
    expected: { data: DATA, status: 200 },
  },
  {
    name: 'auth.confirmEmail',
    call: () => authApi.confirmEmail('t'),
    method: 'post',
    url: '/auth/confirm-email',
    args: [{ token: 't' }],
    expected: { data: DATA, status: 200 },
  },
  {
    name: 'auth.resendConfirmation',
    call: () => authApi.resendConfirmation('a'),
    method: 'post',
    url: '/auth/resend-confirmation',
    args: [{ email: 'a' }],
    expected: { data: DATA, status: 200 },
  },
  {
    name: 'auth.forgotPassword',
    call: () => authApi.forgotPassword({ email: 'a' }),
    method: 'post',
    url: '/auth/forgot-password',
    expected: { data: DATA, status: 200 },
  },
  {
    name: 'auth.resetPassword',
    call: () => authApi.resetPassword('t', { password: 'p', confirm_password: 'p' }),
    method: 'post',
    url: '/auth/reset-password/t',
    expected: { data: DATA, status: 200 },
  },
  {
    name: 'auth.logout',
    call: () => authApi.logout('r'),
    method: 'post',
    url: '/auth/logout',
    args: [{ refresh_token: 'r' }],
    expected: { data: DATA, status: 200 },
  },
  {
    name: 'auth.changePassword',
    call: () =>
      authApi.changePassword({ old_password: 'a', new_password: 'b', confirm_password: 'b' }),
    method: 'post',
    url: '/auth/change-password',
    expected: { data: DATA, status: 200 },
  },

  { name: 'crops.getSeasons', call: () => cropsApi.getSeasons(), method: 'get', url: '/seasons' },
  {
    name: 'crops.createSeason',
    call: () => cropsApi.createSeason(anyPayload),
    method: 'post',
    url: '/seasons',
    args: [anyPayload],
  },
  {
    name: 'crops.updateSeason',
    call: () => cropsApi.updateSeason(1, anyPayload),
    method: 'patch',
    url: '/seasons/1',
    args: [anyPayload],
  },
  {
    name: 'crops.deleteSeason',
    call: () => cropsApi.deleteSeason(1),
    method: 'delete',
    url: '/seasons/1',
  },
  { name: 'crops.getCrops', call: () => cropsApi.getCrops(), method: 'get', url: '/crops' },
  {
    name: 'crops.createCrop',
    call: () => cropsApi.createCrop(anyPayload),
    method: 'post',
    url: '/crops',
  },
  {
    name: 'crops.updateCrop',
    call: () => cropsApi.updateCrop(2, anyPayload),
    method: 'patch',
    url: '/crops/2',
  },
  {
    name: 'crops.deleteCrop',
    call: () => cropsApi.deleteCrop(2),
    method: 'delete',
    url: '/crops/2',
  },
  {
    name: 'crops.getFieldCrops filtrează valorile goale',
    call: () => cropsApi.getFieldCrops({ season_id: 1, field_id: '', crop_id: undefined }),
    method: 'get',
    url: '/field-crops',
    args: [{ params: { season_id: 1 } }],
  },
  {
    name: 'crops.getFieldCrops fără filtru',
    call: () => cropsApi.getFieldCrops(),
    method: 'get',
    url: '/field-crops',
    args: [{ params: {} }],
  },
  {
    name: 'crops.createFieldCrop',
    call: () => cropsApi.createFieldCrop(anyPayload),
    method: 'post',
    url: '/field-crops',
  },
  {
    name: 'crops.updateFieldCrop',
    call: () => cropsApi.updateFieldCrop(3, anyPayload),
    method: 'patch',
    url: '/field-crops/3',
  },
  {
    name: 'crops.deleteFieldCrop',
    call: () => cropsApi.deleteFieldCrop(3),
    method: 'delete',
    url: '/field-crops/3',
  },
  {
    name: 'crops.recordHarvest',
    call: () => cropsApi.recordHarvest(3),
    method: 'post',
    url: '/field-crops/3/harvest',
  },

  {
    name: 'dashboard.getCards',
    call: () => dashboardApi.getCards(),
    method: 'get',
    url: '/dashboard/cards',
    data: { cards: [1] },
    expected: [1],
  },
  {
    name: 'dashboard.getQuickStats',
    call: () => dashboardApi.getQuickStats(),
    method: 'get',
    url: '/dashboard/quick-stats',
  },
  {
    name: 'dashboard.getActivity',
    call: () => dashboardApi.getActivity(),
    method: 'get',
    url: '/dashboard/activity',
    args: [{ params: { limit: 5 } }],
  },

  {
    name: 'fieldOperations.getAll',
    call: () => fieldOperationsApi.getAll({ status: 'planned' }),
    method: 'get',
    url: '/field-operations',
    args: [{ params: { status: 'planned' } }],
  },
  {
    name: 'fieldOperations.getById',
    call: () => fieldOperationsApi.getById(1),
    method: 'get',
    url: '/field-operations/1',
  },
  {
    name: 'fieldOperations.create',
    call: () => fieldOperationsApi.create(anyPayload),
    method: 'post',
    url: '/field-operations',
  },
  {
    name: 'fieldOperations.update',
    call: () => fieldOperationsApi.update(1, anyPayload),
    method: 'patch',
    url: '/field-operations/1',
  },
  {
    name: 'fieldOperations.getConsumptionEstimate',
    call: () => fieldOperationsApi.getConsumptionEstimate(1, 2.5),
    method: 'get',
    url: '/field-operations/1/consumption-estimate',
    args: [{ params: { area_ha: 2.5 } }],
  },
  {
    name: 'fieldOperations.getConsumptionEstimate (suprafața planificată)',
    call: () => fieldOperationsApi.getConsumptionEstimate(1, null),
    method: 'get',
    url: '/field-operations/1/consumption-estimate',
    args: [{ params: undefined }],
  },
  {
    name: 'fieldOperations.complete',
    call: () => fieldOperationsApi.complete(1, anyPayload),
    method: 'patch',
    url: '/field-operations/1/complete',
  },
  {
    name: 'fieldOperations.start',
    call: () => fieldOperationsApi.start(1),
    method: 'patch',
    url: '/field-operations/1/start',
  },
  {
    name: 'fieldOperations.delete',
    call: () => fieldOperationsApi.delete(1),
    method: 'delete',
    url: '/field-operations/1',
  },

  { name: 'fields.getAll', call: () => fieldsApi.getAll(), method: 'get', url: '/fields' },
  {
    name: 'fields.create',
    call: () => fieldsApi.create(anyPayload),
    method: 'post',
    url: '/fields',
  },
  {
    name: 'fields.update',
    call: () => fieldsApi.update('f1', anyPayload),
    method: 'patch',
    url: '/fields/f1',
  },
  {
    name: 'fields.delete',
    call: () => fieldsApi.delete('f1'),
    method: 'delete',
    url: '/fields/f1',
    expected: { data: DATA, status: 200 },
  },

  {
    name: 'implement.getAllImplements',
    call: () => implementApi.getAllImplements(),
    method: 'get',
    url: '/implements',
  },
  {
    name: 'implement.getImplementById',
    call: () => implementApi.getImplementById('1'),
    method: 'get',
    url: '/implements/1',
  },
  {
    name: 'implement.createImplement',
    call: () => implementApi.createImplement(anyPayload),
    method: 'post',
    url: '/implements',
  },
  {
    name: 'implement.updateImplement',
    call: () => implementApi.updateImplement('1', anyPayload),
    method: 'patch',
    url: '/implements/1',
  },
  {
    name: 'implement.deactivateImplement',
    call: () => implementApi.deactivateImplement('1'),
    method: 'patch',
    url: '/implements/1/deactivate',
  },
  {
    name: 'implement.activateImplement',
    call: () => implementApi.activateImplement('1'),
    method: 'patch',
    url: '/implements/1/activate',
  },
  {
    name: 'implement.deleteImplement',
    call: () => implementApi.deleteImplement('1'),
    method: 'delete',
    url: '/implements/1',
  },

  {
    name: 'machine.getAllMachines',
    call: () => machineApi.getAllMachines(),
    method: 'get',
    url: '/machines',
  },
  {
    name: 'machine.getMachineById',
    call: () => machineApi.getMachineById('1'),
    method: 'get',
    url: '/machines/1',
  },
  {
    name: 'machine.createMachine',
    call: () => machineApi.createMachine(anyPayload),
    method: 'post',
    url: '/machines',
  },
  {
    name: 'machine.updateMachine',
    call: () => machineApi.updateMachine('1', anyPayload),
    method: 'patch',
    url: '/machines/1',
  },
  {
    name: 'machine.deleteMachine',
    call: () => machineApi.deleteMachine('1'),
    method: 'delete',
    url: '/machines/1',
  },

  {
    name: 'notifications.getAll',
    call: () => notificationsApi.getAll({ unread: true }),
    method: 'get',
    url: '/notifications',
    args: [{ params: { unread: true } }],
  },
  {
    name: 'notifications.countUnread',
    call: () => notificationsApi.countUnread(),
    method: 'get',
    url: '/notifications/count',
  },
  {
    name: 'notifications.markAsRead',
    call: () => notificationsApi.markAsRead(4),
    method: 'patch',
    url: '/notifications/4/read',
  },
  {
    name: 'notifications.markAllAsRead',
    call: () => notificationsApi.markAllAsRead(),
    method: 'patch',
    url: '/notifications/read-all',
  },

  {
    name: 'operation.getAllTemplates',
    call: () => operationApi.getAllTemplates(),
    method: 'get',
    url: '/operation-templates',
  },
  {
    name: 'operation.getTemplateById',
    call: () => operationApi.getTemplateById(2),
    method: 'get',
    url: '/operation-templates/2',
  },
  {
    name: 'operation.createTemplate',
    call: () => operationApi.createTemplate(anyPayload),
    method: 'post',
    url: '/operation-templates',
  },
  {
    name: 'operation.updateTemplate',
    call: () => operationApi.updateTemplate(2, anyPayload),
    method: 'patch',
    url: '/operation-templates/2',
  },
  {
    name: 'operation.deleteTemplate',
    call: () => operationApi.deleteTemplate(2),
    method: 'delete',
    url: '/operation-templates/2',
  },

  {
    name: 'operator.getAllOperators',
    call: () => operatorApi.getAllOperators(),
    method: 'get',
    url: '/operators',
  },
  {
    name: 'operator.getOperatorById',
    call: () => operatorApi.getOperatorById('1'),
    method: 'get',
    url: '/operators/1',
  },
  {
    name: 'operator.createOperator',
    call: () => operatorApi.createOperator(anyPayload),
    method: 'post',
    url: '/operators',
  },
  {
    name: 'operator.updateOperator',
    call: () => operatorApi.updateOperator('1', anyPayload),
    method: 'patch',
    url: '/operators/1',
  },
  {
    name: 'operator.deleteOperator',
    call: () => operatorApi.deleteOperator('1'),
    method: 'delete',
    url: '/operators/1',
  },
  {
    name: 'operator.disableOperator',
    call: () => operatorApi.disableOperator('1'),
    method: 'patch',
    url: '/operators/1/disable',
  },
  {
    name: 'operator.enableOperator',
    call: () => operatorApi.enableOperator('1'),
    method: 'patch',
    url: '/operators/1/enable',
  },

  {
    name: 'permissions.getMyPermissions',
    call: () => permissionsApi.getMyPermissions(),
    method: 'get',
    url: '/auth/me/permissions',
  },
  {
    name: 'permissions.getAllPermissions',
    call: () => permissionsApi.getAllPermissions(),
    method: 'get',
    url: '/permissions',
  },
  {
    name: 'permissions.getPermissionById',
    call: () => permissionsApi.getPermissionById('3'),
    method: 'get',
    url: '/permissions/3',
  },

  {
    name: 'profile.get',
    call: () => profileApi.get(),
    method: 'get',
    url: '/profile',
    expected: { data: DATA, status: 200 },
  },
  {
    name: 'profile.update',
    call: () => profileApi.update({ first_name: 'A', last_name: 'B' }),
    method: 'patch',
    url: '/profile',
    expected: { data: DATA, status: 200 },
  },

  {
    name: 'reports.getSummary omite valorile goale',
    call: () =>
      reportsApi.getSummary({ from: '2026-01-01', to: '', machine_id: 0, field_id: undefined }),
    method: 'get',
    url: '/reports/summary',
    args: [{ params: { from: '2026-01-01' } }],
  },
  {
    name: 'reports.getOperations',
    call: () => reportsApi.getOperations({}),
    method: 'get',
    url: '/reports/operations',
  },
  {
    name: 'reports.getFields',
    call: () => reportsApi.getFields({}),
    method: 'get',
    url: '/reports/fields',
  },
  {
    name: 'reports.getFleet',
    call: () => reportsApi.getFleet({}),
    method: 'get',
    url: '/reports/fleet',
  },
  {
    name: 'reports.getOperators',
    call: () => reportsApi.getOperators({}),
    method: 'get',
    url: '/reports/operators',
  },
  {
    name: 'reports.getStocks',
    call: () => reportsApi.getStocks({}),
    method: 'get',
    url: '/reports/stocks',
  },
  {
    name: 'reportsExtra.getWeather',
    call: () => reportsExtraApi.getWeather({}),
    method: 'get',
    url: '/reports/weather',
  },
  {
    name: 'reportsExtra.getCrops',
    call: () => reportsExtraApi.getCrops(0, ''),
    method: 'get',
    url: '/reports/crops',
    args: [{ params: { season_id: undefined, field_id: undefined } }],
  },
  {
    name: 'reportsExtra.emailSummary',
    call: () => reportsExtraApi.emailSummary({ from: '2026-01-01', to: '2026-01-31' }),
    method: 'post',
    url: '/reports/summary/email',
    args: [null, { params: { from: '2026-01-01', to: '2026-01-31' } }],
  },

  {
    name: 'resource.getAllResourceTypes',
    call: () => resourceApi.getAllResourceTypes(),
    method: 'get',
    url: '/resource-types',
  },
  {
    name: 'resource.createResourceType',
    call: () => resourceApi.createResourceType(anyPayload),
    method: 'post',
    url: '/resource-types',
  },
  {
    name: 'resource.updateResourceType',
    call: () => resourceApi.updateResourceType('1', anyPayload),
    method: 'patch',
    url: '/resource-types/1',
  },
  {
    name: 'resource.deleteResourceType',
    call: () => resourceApi.deleteResourceType('1'),
    method: 'delete',
    url: '/resource-types/1',
  },
  {
    name: 'resource.getAllResources',
    call: () => resourceApi.getAllResources(),
    method: 'get',
    url: '/resources',
  },
  {
    name: 'resource.getResourceById',
    call: () => resourceApi.getResourceById('1'),
    method: 'get',
    url: '/resources/1',
  },
  {
    name: 'resource.createResource',
    call: () => resourceApi.createResource(anyPayload),
    method: 'post',
    url: '/resources',
  },
  {
    name: 'resource.updateResource',
    call: () => resourceApi.updateResource('1', anyPayload),
    method: 'patch',
    url: '/resources/1',
  },
  {
    name: 'resource.deleteResource',
    call: () => resourceApi.deleteResource('1'),
    method: 'delete',
    url: '/resources/1',
  },

  { name: 'roles.getAll', call: () => rolesApi.getAll(), method: 'get', url: '/roles' },
  {
    name: 'roles.getRolePermissions',
    call: () => rolesApi.getRolePermissions('1'),
    method: 'get',
    url: '/roles/1/permissions',
  },

  {
    name: 'stockMovements.list filtrează valorile goale',
    call: () => stockMovementsApi.list({ resource_id: 1, from: '' }),
    method: 'get',
    url: '/stock-movements',
    args: [{ params: { resource_id: 1 } }],
  },
  {
    name: 'stockMovements.list fără filtru',
    call: () => stockMovementsApi.list(),
    method: 'get',
    url: '/stock-movements',
    args: [{ params: {} }],
  },
  {
    name: 'stockMovements.create',
    call: () => stockMovementsApi.create(anyPayload),
    method: 'post',
    url: '/stock-movements',
  },

  { name: 'users.getAll', call: () => usersApi.getAll(), method: 'get', url: '/users' },
  { name: 'users.getById', call: () => usersApi.getById('1'), method: 'get', url: '/users/1' },
  { name: 'users.create', call: () => usersApi.create(anyPayload), method: 'post', url: '/users' },
  {
    name: 'users.update',
    call: () => usersApi.update('1', anyPayload),
    method: 'patch',
    url: '/users/1',
  },
  {
    name: 'users.disableUsers',
    call: () => usersApi.disableUsers('1'),
    method: 'delete',
    url: '/users/1',
    expected: { data: DATA, status: 200 },
  },
  {
    name: 'users.enableUsers',
    call: () => usersApi.enableUsers('1'),
    method: 'patch',
    url: '/users/1/enable',
    expected: { data: DATA, status: 200 },
  },
  {
    name: 'users.delete',
    call: () => usersApi.delete('1'),
    method: 'delete',
    url: '/users/1',
    expected: { data: DATA, status: 200 },
  },

  {
    name: 'weather.getCurrent',
    call: () => weatherApi.getCurrent({ lat: 1, lng: 2 }),
    method: 'get',
    url: '/weather/current',
    args: [{ params: { lat: 1, lng: 2 } }],
  },
]

describe('wrapperele API', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each(cases)('$name', async ({ call, method, url, args, expected, data }) => {
    const response = { data: data ?? DATA, status: 200 } as AxiosResponse
    vi.mocked(api[method]).mockResolvedValue(response)

    const result = await call()

    const [calledUrl, ...calledArgs] = vi.mocked(api[method]).mock.calls[0]
    expect(calledUrl).toBe(url)
    if (args) expect(calledArgs).toEqual(args)
    expect(result).toEqual(expected ?? response.data)
  })

  it('profile.uploadPhoto trimite fișierul ca multipart', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { profile_photo: 'u' },
      status: 200,
    } as AxiosResponse)
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    await profileApi.uploadPhoto(file)
    const [url, form, options] = vi.mocked(api.post).mock.calls[0]
    expect(url).toBe('/profile/photo')
    expect((form as FormData).get('photo')).toBe(file)
    expect(options).toEqual({ headers: { 'Content-Type': 'multipart/form-data' } })
  })

  it('reportsExtra.getCrops trimite filtrele setate', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: DATA, status: 200 } as AxiosResponse)
    await reportsExtraApi.getCrops(2, 'f1')
    expect(vi.mocked(api.get).mock.calls[0][1]).toEqual({
      params: { season_id: 2, field_id: 'f1' },
    })
  })
})

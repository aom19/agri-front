import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AxiosResponse } from 'axios'
import { rolesApi, type Role } from '../api/roles.api'
import { usersApi, type User } from '../api/users.api'
import {
  expectQueryData,
  expectQueryDisabled,
  invalidatedKeys,
  runMutation,
  setAuth,
} from '../test/utils'
import {
  ROLES_KEY,
  useCreateRole,
  useDeleteRole,
  useRolePermissions,
  useRoles,
  useSetRolePermissions,
  useUpdateRole,
} from './useRoles'
import {
  USERS_KEY,
  useCreateUser,
  useDeleteUser,
  useDisableUsers,
  useEnableUsers,
  useUpdateUser,
  useUsers,
} from './useUsers'

vi.mock('../api/roles.api')
vi.mock('../api/users.api')

const role = { id: 1, code: 'admin' } as Role
const user = { id: 1, email: 'ana@x.ro' } as User
const perms = [{ id: 1, name: 'machines:read', description: '' }]

describe('useRoles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuth()
  })

  it('încarcă rolurile și permisiunile unui rol', async () => {
    vi.mocked(rolesApi.getAll).mockResolvedValue([role])
    vi.mocked(rolesApi.getRolePermissions).mockResolvedValue(perms)
    await expectQueryData(() => useRoles(), [role])
    await expectQueryData(() => useRolePermissions('1'), perms)
    expectQueryDisabled(() => useRolePermissions('1', false))
    setAuth(null)
    expectQueryDisabled(() => useRoles())
  })

  it('mutațiile invalidează rolurile, respectiv permisiunile rolului', async () => {
    vi.mocked(rolesApi.create).mockResolvedValue(role)
    vi.mocked(rolesApi.update).mockResolvedValue(role)
    vi.mocked(rolesApi.delete).mockResolvedValue({} as AxiosResponse)
    vi.mocked(rolesApi.setRolePermissions).mockResolvedValue({ message: 'ok' })
    const payload = { code: 'admin', name: 'Admin' }
    for (const run of [
      await runMutation(() => useCreateRole(), payload),
      await runMutation(() => useUpdateRole(), { id: '1', payload }),
      await runMutation(() => useDeleteRole(), '1'),
    ]) {
      expect(invalidatedKeys(run.invalidate)).toEqual([ROLES_KEY])
    }
    const set = await runMutation(() => useSetRolePermissions(), {
      id: '1',
      payload: { permission_ids: [1] },
    })
    expect(rolesApi.setRolePermissions).toHaveBeenCalledWith('1', { permission_ids: [1] })
    expect(invalidatedKeys(set.invalidate)).toEqual([['role-permissions', '1']])
  })
})

describe('useUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuth()
  })

  it('încarcă utilizatorii doar cu sesiune', async () => {
    vi.mocked(usersApi.getAll).mockResolvedValue([user])
    await expectQueryData(() => useUsers(), [user])
    setAuth(null)
    expectQueryDisabled(() => useUsers())
  })

  it('mutațiile invalidează lista de utilizatori', async () => {
    vi.mocked(usersApi.create).mockResolvedValue(user)
    vi.mocked(usersApi.update).mockResolvedValue(user)
    vi.mocked(usersApi.delete).mockResolvedValue({} as AxiosResponse)
    vi.mocked(usersApi.disableUsers).mockResolvedValue({} as AxiosResponse)
    vi.mocked(usersApi.enableUsers).mockResolvedValue({} as AxiosResponse)
    const payload = { email: 'ana@x.ro', role_id: 1, email_confirmed: true }
    for (const run of [
      await runMutation(() => useCreateUser(), payload),
      await runMutation(() => useUpdateUser(), { id: '1', payload }),
      await runMutation(() => useDeleteUser(), '1'),
      await runMutation(() => useDisableUsers(), '1'),
      await runMutation(() => useEnableUsers(), '1'),
    ]) {
      expect(invalidatedKeys(run.invalidate)).toEqual([USERS_KEY])
    }
    expect(usersApi.update).toHaveBeenCalledWith('1', payload)
  })
})

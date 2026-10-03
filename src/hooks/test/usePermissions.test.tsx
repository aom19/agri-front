import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { permissionsApi, type Permission } from '../../api/permissions.api'
import { createWrapper, expectQueryData, expectQueryDisabled, setAuth } from '../../test/utils'
import {
  useAllPermissions,
  useHasPermission,
  usePermissionById,
  usePermissionSet,
  usePermissions,
} from '../usePermissions'

vi.mock('../../api/permissions.api')

const perms: Permission[] = [{ id: 1, name: 'machines:read', description: '' }]

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuth()
  })

  it('încarcă permisiunile utilizatorului și le expune ca set', async () => {
    vi.mocked(permissionsApi.getMyPermissions).mockResolvedValue(perms)
    await expectQueryData(() => usePermissions(), perms)
    const { result } = renderHook(() => usePermissionSet(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.has('machines:read')).toBe(true))
  })

  it('useHasPermission răspunde pentru o permisiune anume', async () => {
    vi.mocked(permissionsApi.getMyPermissions).mockResolvedValue(perms)
    const { result } = renderHook(
      () => [useHasPermission('machines:read'), useHasPermission('users:write')],
      {
        wrapper: createWrapper(),
      }
    )
    expect(result.current).toEqual([false, false])
    await waitFor(() => expect(result.current).toEqual([true, false]))
  })

  it('nu interoghează API-ul fără sesiune', () => {
    setAuth(null)
    expectQueryDisabled(() => usePermissions())
    expect(permissionsApi.getMyPermissions).not.toHaveBeenCalled()
  })

  it('încarcă toate permisiunile și una după id', async () => {
    vi.mocked(permissionsApi.getAllPermissions).mockResolvedValue(perms)
    vi.mocked(permissionsApi.getPermissionById).mockResolvedValue(perms[0])
    await expectQueryData(() => useAllPermissions(), perms)
    await expectQueryData(() => usePermissionById('1'), perms[0])
    expect(permissionsApi.getPermissionById).toHaveBeenCalledWith('1')
  })
})

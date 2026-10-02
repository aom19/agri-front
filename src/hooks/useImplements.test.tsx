import { beforeEach, describe, expect, it, vi } from 'vitest'
import { implementApi, type Implement } from '../api/implement.api'
import {
  expectQueryData,
  expectQueryDisabled,
  invalidatedKeys,
  runMutation,
  setAuth,
} from '../test/utils'
import {
  IMPLEMENTS_KEY,
  useActivateImplement,
  useCreateImplement,
  useDeactivateImplement,
  useDeleteImplement,
  useImplementById,
  useImplements,
  useUpdateImplement,
} from './useImplements'

vi.mock('../api/implement.api')

const implement = { id: 1, name: 'Plug' } as Implement
const payload = { name: 'Plug', code: 'PL-1' } as Omit<Implement, 'id'>

describe('useImplements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuth()
  })

  it('încarcă lista și un echipament după id', async () => {
    vi.mocked(implementApi.getAllImplements).mockResolvedValue([implement])
    vi.mocked(implementApi.getImplementById).mockResolvedValue(implement)
    await expectQueryData(() => useImplements(), [implement])
    await expectQueryData(() => useImplementById('1'), implement)
    setAuth(null)
    expectQueryDisabled(() => useImplements())
  })

  it('mutațiile apelează API-ul și invalidează lista', async () => {
    vi.mocked(implementApi.createImplement).mockResolvedValue(implement)
    vi.mocked(implementApi.updateImplement).mockResolvedValue(implement)
    vi.mocked(implementApi.deleteImplement).mockResolvedValue(undefined)
    vi.mocked(implementApi.activateImplement).mockResolvedValue(undefined)
    vi.mocked(implementApi.deactivateImplement).mockResolvedValue(undefined)

    const runs = [
      await runMutation(() => useCreateImplement(), payload),
      await runMutation(() => useUpdateImplement(), { id: '1', payload }),
      await runMutation(() => useDeleteImplement(), '1'),
      await runMutation(() => useActivateImplement(), '1'),
      await runMutation(() => useDeactivateImplement(), '1'),
    ]
    for (const run of runs) {
      expect(invalidatedKeys(run.invalidate)).toEqual([IMPLEMENTS_KEY])
    }
    expect(implementApi.createImplement).toHaveBeenCalledWith(payload)
    expect(implementApi.updateImplement).toHaveBeenCalledWith('1', payload)
    expect(implementApi.deleteImplement).toHaveBeenCalledWith('1')
    expect(implementApi.activateImplement).toHaveBeenCalledWith('1')
    expect(implementApi.deactivateImplement).toHaveBeenCalledWith('1')
  })
})

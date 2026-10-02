import { beforeEach, describe, expect, it, vi } from 'vitest'
import { machineApi, type Machine } from '../api/machine.api'
import {
  expectQueryData,
  expectQueryDisabled,
  invalidatedKeys,
  runMutation,
  setAuth,
} from '../test/utils'
import {
  MACHINE_KEY,
  useCreateMachine,
  useDeleteMachine,
  useMachineById,
  useMachines,
  useUpdateMachine,
} from './useMachines'

vi.mock('../api/machine.api')

const machine = { id: 1, name: 'T1' } as Machine
const payload = { name: 'T1', code: 'TR-1', type: 'tractor' } as Omit<Machine, 'id'>

describe('useMachines', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuth()
  })

  it('încarcă lista și o mașină după id', async () => {
    vi.mocked(machineApi.getAllMachines).mockResolvedValue([machine])
    vi.mocked(machineApi.getMachineById).mockResolvedValue(machine)
    await expectQueryData(() => useMachines(), [machine])
    await expectQueryData(() => useMachineById('1'), machine)
    expect(machineApi.getMachineById).toHaveBeenCalledWith('1')
  })

  it('nu interoghează fără sesiune', () => {
    setAuth(null)
    expectQueryDisabled(() => useMachines())
    expectQueryDisabled(() => useMachineById('1'))
  })

  it('mutațiile apelează API-ul și invalidează lista', async () => {
    vi.mocked(machineApi.createMachine).mockResolvedValue(machine)
    vi.mocked(machineApi.updateMachine).mockResolvedValue(machine)
    vi.mocked(machineApi.deleteMachine).mockResolvedValue(undefined)

    const created = await runMutation(() => useCreateMachine(), payload)
    expect(machineApi.createMachine).toHaveBeenCalledWith(payload)
    expect(invalidatedKeys(created.invalidate)).toEqual([MACHINE_KEY])

    const updated = await runMutation(() => useUpdateMachine(), { id: '1', payload })
    expect(machineApi.updateMachine).toHaveBeenCalledWith('1', payload)
    expect(invalidatedKeys(updated.invalidate)).toEqual([MACHINE_KEY])

    const deleted = await runMutation(() => useDeleteMachine(), '1')
    expect(machineApi.deleteMachine).toHaveBeenCalledWith('1')
    expect(invalidatedKeys(deleted.invalidate)).toEqual([MACHINE_KEY])
  })
})

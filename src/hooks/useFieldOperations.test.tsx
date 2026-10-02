import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fieldOperationsApi,
  type FieldOperation,
  type FieldOperationPayload,
} from '../api/fieldOperation.api'
import {
  expectQueryData,
  expectQueryDisabled,
  invalidatedKeys,
  runMutation,
  setAuth,
} from '../test/utils'
import {
  FIELD_OPERATIONS_KEY,
  useCompleteFieldOperation,
  useCreateFieldOperation,
  useDeleteFieldOperation,
  useFieldOperation,
  useFieldOperations,
  useStartFieldOperation,
  useUpdateFieldOperation,
  useUpdateFieldOperationChecklist,
} from './useFieldOperations'

vi.mock('../api/fieldOperation.api')

const operation = { id: 1, status: 'planned' } as FieldOperation
const payload = { field_id: 'f1', operation_type_id: 1 } as FieldOperationPayload
const checklist = {
  machine_status: true,
  implement_status: true,
  field_area: true,
  notes_confirmed: true,
}

describe('useFieldOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuth()
  })

  it('încarcă lista filtrată și detaliul', async () => {
    vi.mocked(fieldOperationsApi.getAll).mockResolvedValue([operation])
    vi.mocked(fieldOperationsApi.getById).mockResolvedValue(operation)
    await expectQueryData(() => useFieldOperations({ status: 'planned' }), [operation])
    expect(fieldOperationsApi.getAll).toHaveBeenCalledWith({ status: 'planned' })
    await expectQueryData(() => useFieldOperation(1), operation)
    expectQueryDisabled(() => useFieldOperation(null))
    setAuth(null)
    expectQueryDisabled(() => useFieldOperations())
  })

  it('mutațiile invalidează lista, iar finalizarea și stocurile/rapoartele', async () => {
    vi.mocked(fieldOperationsApi.create).mockResolvedValue(operation)
    vi.mocked(fieldOperationsApi.update).mockResolvedValue(operation)
    vi.mocked(fieldOperationsApi.updateChecklist).mockResolvedValue(operation)
    vi.mocked(fieldOperationsApi.start).mockResolvedValue(operation)
    vi.mocked(fieldOperationsApi.delete).mockResolvedValue(undefined)
    vi.mocked(fieldOperationsApi.complete).mockResolvedValue({ operation, movements: [] })

    const simple = [
      await runMutation(() => useCreateFieldOperation(), payload),
      await runMutation(() => useUpdateFieldOperation(), { id: 1, payload }),
      await runMutation(() => useUpdateFieldOperationChecklist(), { id: 1, payload: checklist }),
      await runMutation(() => useStartFieldOperation(), 1),
      await runMutation(() => useDeleteFieldOperation(), 1),
    ]
    for (const run of simple) {
      expect(invalidatedKeys(run.invalidate)).toEqual([FIELD_OPERATIONS_KEY])
    }
    expect(fieldOperationsApi.updateChecklist).toHaveBeenCalledWith(1, checklist)

    const completed = await runMutation(() => useCompleteFieldOperation(), {
      id: 1,
      payload: { notes: 'gata' },
    })
    expect(fieldOperationsApi.complete).toHaveBeenCalledWith(1, { notes: 'gata' })
    expect(invalidatedKeys(completed.invalidate)).toEqual([
      FIELD_OPERATIONS_KEY,
      ['stocks'],
      ['stock-movements'],
      ['reports'],
      ['dashboard-cards'],
    ])
  })
})

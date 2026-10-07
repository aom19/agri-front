import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fieldOperationsApi,
  type FieldOperation,
  type FieldOperationPayload,
} from '../../api/fieldOperation.api'
import {
  expectQueryData,
  expectQueryDisabled,
  invalidatedKeys,
  runMutation,
  setAuth,
} from '../../test/utils'
import {
  FIELD_OPERATIONS_KEY,
  useCompleteFieldOperation,
  useConsumptionEstimate,
  useCreateFieldOperation,
  useDeleteFieldOperation,
  useFieldOperation,
  useFieldOperations,
  useStartFieldOperation,
  useUpdateFieldOperation,
} from '../useFieldOperations'

vi.mock('../../api/fieldOperation.api')

const operation = { id: 1, status: 'planned' } as FieldOperation
const payload = { field_id: 'f1', operation_type_id: 1 } as FieldOperationPayload

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
    const estimate = { area_ha: 4, items: [], fuel_resources: [] }
    vi.mocked(fieldOperationsApi.getConsumptionEstimate).mockResolvedValue(estimate)
    await expectQueryData(() => useConsumptionEstimate(1, 4), estimate)
    expect(fieldOperationsApi.getConsumptionEstimate).toHaveBeenCalledWith(1, 4)
    expectQueryDisabled(() => useConsumptionEstimate(null, 4))
    setAuth(null)
    expectQueryDisabled(() => useFieldOperations())
  })

  it('mutațiile invalidează lista, iar finalizarea și stocurile/rapoartele', async () => {
    vi.mocked(fieldOperationsApi.create).mockResolvedValue(operation)
    vi.mocked(fieldOperationsApi.update).mockResolvedValue(operation)
    vi.mocked(fieldOperationsApi.start).mockResolvedValue(operation)
    vi.mocked(fieldOperationsApi.delete).mockResolvedValue(undefined)
    vi.mocked(fieldOperationsApi.complete).mockResolvedValue({ operation, movements: [] })

    const simple = [
      await runMutation(() => useCreateFieldOperation(), payload),
      await runMutation(() => useUpdateFieldOperation(), { id: 1, payload }),
      await runMutation(() => useStartFieldOperation(), 1),
      await runMutation(() => useDeleteFieldOperation(), 1),
    ]
    for (const run of simple) {
      expect(invalidatedKeys(run.invalidate)).toEqual([FIELD_OPERATIONS_KEY])
    }

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

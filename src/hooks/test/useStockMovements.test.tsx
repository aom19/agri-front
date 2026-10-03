import { beforeEach, describe, expect, it, vi } from 'vitest'
import { stockMovementsApi, type StockMovement } from '../../api/stockMovement.api'
import {
  expectQueryData,
  expectQueryDisabled,
  invalidatedKeys,
  runMutation,
  setAuth,
} from '../../test/utils'
import {
  STOCK_MOVEMENTS_KEY,
  useCreateStockMovement,
  useStockMovements,
} from '../useStockMovements'

vi.mock('../../api/stockMovement.api')

const movement = { id: 1, quantity_delta: 5 } as StockMovement

describe('useStockMovements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuth()
  })

  it('încarcă mișcările după filtru și respectă flag-ul enabled', async () => {
    vi.mocked(stockMovementsApi.list).mockResolvedValue([movement])
    await expectQueryData(() => useStockMovements({ stock_id: 1 }), [movement])
    expect(stockMovementsApi.list).toHaveBeenCalledWith({ stock_id: 1 })
    expectQueryDisabled(() => useStockMovements({}, false))
    setAuth(null)
    expectQueryDisabled(() => useStockMovements({}))
  })

  it('crearea unei mișcări invalidează mișcările, stocurile și rapoartele', async () => {
    vi.mocked(stockMovementsApi.create).mockResolvedValue(movement)
    const payload = { stock_id: 1, movement_type: 'in' as const, quantity: 5 }
    const { invalidate } = await runMutation(() => useCreateStockMovement(), payload)
    expect(stockMovementsApi.create).toHaveBeenCalledWith(payload)
    expect(invalidatedKeys(invalidate)).toEqual([STOCK_MOVEMENTS_KEY, ['stocks'], ['reports']])
  })
})

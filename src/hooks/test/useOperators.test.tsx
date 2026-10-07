import { beforeEach, describe, expect, it, vi } from 'vitest'
import { operatorApi, type Operator } from '../../api/operator.api'
import {
  expectQueryData,
  expectQueryDisabled,
  invalidatedKeys,
  runMutation,
  setAuth,
} from '../../test/utils'
import {
  OPERATOR_KEY,
  useCreateOperator,
  useDeleteOperator,
  useDisableOperator,
  useEnableOperator,
  useOperatorById,
  useOperators,
  useUpdateOperator,
} from '../useOperators'

vi.mock('../../api/operator.api')

const operator = { id: 1, name: 'Ion' } as Operator
const payload = {
  first_name: 'Ion',
  last_name: '',
  phone: '',
  email: '',
  notes: '',
}

describe('useOperators', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuth()
  })

  it('încarcă lista și un operator după id', async () => {
    vi.mocked(operatorApi.getAllOperators).mockResolvedValue([operator])
    vi.mocked(operatorApi.getOperatorById).mockResolvedValue(operator)
    await expectQueryData(() => useOperators(), [operator])
    await expectQueryData(() => useOperatorById('1'), operator)
    setAuth(null)
    expectQueryDisabled(() => useOperators())
    expectQueryDisabled(() => useOperatorById('1'))
  })

  it('mutațiile apelează API-ul și invalidează lista', async () => {
    vi.mocked(operatorApi.createOperator).mockResolvedValue(operator)
    vi.mocked(operatorApi.updateOperator).mockResolvedValue(operator)
    vi.mocked(operatorApi.deleteOperator).mockResolvedValue(undefined)
    vi.mocked(operatorApi.disableOperator).mockResolvedValue(operator)
    vi.mocked(operatorApi.enableOperator).mockResolvedValue(operator)

    const runs = [
      await runMutation(() => useCreateOperator(), payload),
      await runMutation(() => useUpdateOperator(), { id: '1', payload }),
      await runMutation(() => useDeleteOperator(), '1'),
      await runMutation(() => useDisableOperator(), '1'),
      await runMutation(() => useEnableOperator(), '1'),
    ]
    for (const run of runs) {
      expect(invalidatedKeys(run.invalidate)).toEqual([OPERATOR_KEY])
    }
    expect(operatorApi.createOperator).toHaveBeenCalledWith(payload, expect.anything())
    expect(operatorApi.updateOperator).toHaveBeenCalledWith('1', payload)
    expect(operatorApi.disableOperator).toHaveBeenCalledWith('1')
    expect(operatorApi.enableOperator).toHaveBeenCalledWith('1')
  })
})

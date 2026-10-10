import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  operationApi,
  type OperationTemplate,
  type OperationTemplatePayload,
} from '../../api/operation.api'
import {
  expectQueryData,
  expectQueryDisabled,
  invalidatedKeys,
  runMutation,
  setAuth,
} from '../../test/utils'
import {
  OPERATION_TEMPLATES_KEY,
  useCreateOperationTemplate,
  useDeleteOperationTemplate,
  useOperationTemplate,
  useOperationTemplates,
  useUpdateOperationTemplate,
} from '../useOperations'

vi.mock('../../api/operation.api')

const template = { id: 2, name: 'Arat' } as OperationTemplate

describe('useOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuth()
  })

  it('încarcă template-urile', async () => {
    vi.mocked(operationApi.getAllTemplates).mockResolvedValue([template])
    vi.mocked(operationApi.getTemplateById).mockResolvedValue(template)
    await expectQueryData(() => useOperationTemplates(), [template])
    await expectQueryData(() => useOperationTemplate(2), template)
    expectQueryDisabled(() => useOperationTemplate(null))
    setAuth(null)
    expectQueryDisabled(() => useOperationTemplates())
  })

  it('mutațiile invalidează cache-ul template-urilor', async () => {
    vi.mocked(operationApi.createTemplate).mockResolvedValue(template)
    vi.mocked(operationApi.updateTemplate).mockResolvedValue(template)
    vi.mocked(operationApi.deleteTemplate).mockResolvedValue(undefined)
    const templatePayload: OperationTemplatePayload = {
      operation_type: 'soil_preparation',
      name: 'Arat',
      description: '',
      unit: 'ha',
    }

    expect(
      invalidatedKeys(
        (await runMutation(() => useCreateOperationTemplate(), templatePayload)).invalidate
      )
    ).toEqual([OPERATION_TEMPLATES_KEY])
    expect(
      invalidatedKeys(
        (await runMutation(() => useUpdateOperationTemplate(), { id: 2, payload: templatePayload }))
          .invalidate
      )
    ).toEqual([OPERATION_TEMPLATES_KEY])
    expect(
      invalidatedKeys((await runMutation(() => useDeleteOperationTemplate(), 2)).invalidate)
    ).toEqual([OPERATION_TEMPLATES_KEY])
    expect(operationApi.updateTemplate).toHaveBeenCalledWith(2, templatePayload)
  })
})

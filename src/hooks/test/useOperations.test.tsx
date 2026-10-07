import { beforeEach, describe, expect, it, vi } from 'vitest'
import { operationApi, type OperationTemplate, type OperationType } from '../../api/operation.api'
import {
  expectQueryData,
  expectQueryDisabled,
  invalidatedKeys,
  runMutation,
  setAuth,
} from '../../test/utils'
import {
  OPERATION_TEMPLATES_KEY,
  OPERATION_TYPES_KEY,
  useCreateOperationTemplate,
  useCreateOperationType,
  useDeleteOperationTemplate,
  useDeleteOperationType,
  useOperationTemplate,
  useOperationTemplates,
  useOperationTypes,
  useUpdateOperationTemplate,
  useUpdateOperationType,
} from '../useOperations'

vi.mock('../../api/operation.api')

const type = { id: 1, code: 'arat' } as OperationType
const template = { id: 2, name: 'Arat' } as OperationTemplate

describe('useOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuth()
  })

  it('încarcă tipurile și template-urile', async () => {
    vi.mocked(operationApi.getAllTypes).mockResolvedValue([type])
    vi.mocked(operationApi.getAllTemplates).mockResolvedValue([template])
    vi.mocked(operationApi.getTemplateById).mockResolvedValue(template)
    await expectQueryData(() => useOperationTypes(), [type])
    await expectQueryData(() => useOperationTemplates(), [template])
    await expectQueryData(() => useOperationTemplate(2), template)
    expectQueryDisabled(() => useOperationTemplate(null))
    setAuth(null)
    expectQueryDisabled(() => useOperationTypes())
  })

  it('mutațiile invalidează cache-urile potrivite', async () => {
    vi.mocked(operationApi.createType).mockResolvedValue(type)
    vi.mocked(operationApi.updateType).mockResolvedValue(type)
    vi.mocked(operationApi.deleteType).mockResolvedValue(undefined)
    vi.mocked(operationApi.createTemplate).mockResolvedValue(template)
    vi.mocked(operationApi.updateTemplate).mockResolvedValue(template)
    vi.mocked(operationApi.deleteTemplate).mockResolvedValue(undefined)
    const typePayload = { code: 'arat', name: 'Arat', description: '' }
    const templatePayload = { operation_type_id: 1, name: 'Arat', description: '', unit: 'ha' }

    expect(
      invalidatedKeys((await runMutation(() => useCreateOperationType(), typePayload)).invalidate)
    ).toEqual([OPERATION_TYPES_KEY])
    expect(
      invalidatedKeys(
        (await runMutation(() => useUpdateOperationType(), { id: 1, payload: typePayload }))
          .invalidate
      )
    ).toEqual([OPERATION_TYPES_KEY])
    expect(
      invalidatedKeys((await runMutation(() => useDeleteOperationType(), 1)).invalidate)
    ).toEqual([OPERATION_TYPES_KEY, OPERATION_TEMPLATES_KEY])
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
    expect(operationApi.updateType).toHaveBeenCalledWith(1, typePayload)
    expect(operationApi.updateTemplate).toHaveBeenCalledWith(2, templatePayload)
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resourceApi, type Resource, type ResourceType } from '../../api/resource.api'
import {
  expectQueryData,
  expectQueryDisabled,
  invalidatedKeys,
  runMutation,
  setAuth,
} from '../../test/utils'
import {
  RESOURCES_KEY,
  RESOURCE_TYPES_KEY,
  useCreateResource,
  useCreateResourceType,
  useDeleteResource,
  useDeleteResourceType,
  useResourceTypes,
  useResources,
  useUpdateResource,
  useUpdateResourceType,
} from '../useResources'

vi.mock('../../api/resource.api')

const resource = { id: 1, name: 'Motorină', quantity: 10, minimum_quantity: 2 } as Resource
const resourceType = { id: 1, name: 'Combustibil' } as ResourceType

describe('useResources', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuth()
  })

  it('încarcă resursele, cu stocul lor, și tipurile', async () => {
    vi.mocked(resourceApi.getAllResources).mockResolvedValue([resource])
    vi.mocked(resourceApi.getAllResourceTypes).mockResolvedValue([resourceType])
    await expectQueryData(() => useResources(), [resource])
    await expectQueryData(() => useResourceTypes(), [resourceType])
    setAuth(null)
    expectQueryDisabled(() => useResources())
    expectQueryDisabled(() => useResourceTypes())
  })

  it('mutațiile pe tipuri invalidează tipurile și resursele', async () => {
    vi.mocked(resourceApi.createResourceType).mockResolvedValue(resourceType)
    vi.mocked(resourceApi.updateResourceType).mockResolvedValue(resourceType)
    vi.mocked(resourceApi.deleteResourceType).mockResolvedValue(undefined)
    const payload = { name: 'Combustibil', category: 'fuel' as const, default_unit: 'l' }
    const runs = [
      await runMutation(() => useCreateResourceType(), payload),
      await runMutation(() => useUpdateResourceType(), { id: '1', payload }),
      await runMutation(() => useDeleteResourceType(), '1'),
    ]
    for (const run of runs) {
      expect(invalidatedKeys(run.invalidate)).toEqual([RESOURCE_TYPES_KEY, RESOURCES_KEY])
    }
    expect(resourceApi.updateResourceType).toHaveBeenCalledWith('1', payload)
  })

  it('mutațiile pe resurse invalidează lista; stocul inițial se trimite doar la creare', async () => {
    vi.mocked(resourceApi.createResource).mockResolvedValue(resource)
    vi.mocked(resourceApi.updateResource).mockResolvedValue(resource)
    vi.mocked(resourceApi.deleteResource).mockResolvedValue(undefined)
    const payload = {
      name: 'Motorină',
      resource_type_id: 1,
      price_per_unit: 7,
      minimum_quantity: 2,
      notes: null,
    }

    for (const run of [
      await runMutation(() => useCreateResource(), { ...payload, quantity: 10 }),
      await runMutation(() => useUpdateResource(), { id: '1', payload }),
      await runMutation(() => useDeleteResource(), '1'),
    ]) {
      expect(invalidatedKeys(run.invalidate)).toEqual([RESOURCES_KEY])
    }
    expect(resourceApi.createResource).toHaveBeenCalledWith({ ...payload, quantity: 10 })
    expect(resourceApi.updateResource).toHaveBeenCalledWith('1', payload)
  })
})

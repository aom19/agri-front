import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resourceApi, type Resource, type ResourceType, type Stock } from '../../api/resource.api'
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
import { STOCKS_KEY, useCreateStock, useDeleteStock, useStocks, useUpdateStock } from '../useStocks'

vi.mock('../../api/resource.api')

const resource = { id: 1, name: 'Motorină' } as Resource
const resourceType = { id: 1, name: 'Combustibil' } as ResourceType
const stock = { id: 1, quantity: 10 } as Stock

describe('useResources / useStocks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuth()
  })

  it('încarcă resursele, tipurile și stocurile', async () => {
    vi.mocked(resourceApi.getAllResources).mockResolvedValue([resource])
    vi.mocked(resourceApi.getAllResourceTypes).mockResolvedValue([resourceType])
    vi.mocked(resourceApi.getAllStocks).mockResolvedValue([stock])
    await expectQueryData(() => useResources(), [resource])
    await expectQueryData(() => useResourceTypes(), [resourceType])
    await expectQueryData(() => useStocks(), [stock])
    setAuth(null)
    expectQueryDisabled(() => useResources())
    expectQueryDisabled(() => useResourceTypes())
    expectQueryDisabled(() => useStocks())
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

  it('mutațiile pe resurse și stocuri invalidează listele lor', async () => {
    vi.mocked(resourceApi.createResource).mockResolvedValue(resource)
    vi.mocked(resourceApi.updateResource).mockResolvedValue(resource)
    vi.mocked(resourceApi.deleteResource).mockResolvedValue(undefined)
    vi.mocked(resourceApi.createStock).mockResolvedValue(stock)
    vi.mocked(resourceApi.updateStock).mockResolvedValue(stock)
    vi.mocked(resourceApi.deleteStock).mockResolvedValue(undefined)
    const resourcePayload = {
      name: 'Motorină',
      resource_type_id: 1,
      price_per_unit: 7,
      notes: null,
    }
    const stockPayload = { resource_id: 1, quantity: 10, minimum_quantity: 1 }

    for (const run of [
      await runMutation(() => useCreateResource(), resourcePayload),
      await runMutation(() => useUpdateResource(), { id: '1', payload: resourcePayload }),
      await runMutation(() => useDeleteResource(), '1'),
    ]) {
      expect(invalidatedKeys(run.invalidate)).toEqual([RESOURCES_KEY])
    }
    for (const run of [
      await runMutation(() => useCreateStock(), stockPayload),
      await runMutation(() => useUpdateStock(), { id: '1', payload: stockPayload }),
      await runMutation(() => useDeleteStock(), '1'),
    ]) {
      expect(invalidatedKeys(run.invalidate)).toEqual([STOCKS_KEY])
    }
    expect(resourceApi.updateResource).toHaveBeenCalledWith('1', resourcePayload)
    expect(resourceApi.updateStock).toHaveBeenCalledWith('1', stockPayload)
  })
})

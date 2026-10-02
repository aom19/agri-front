import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AxiosResponse } from 'axios'
import { fieldsApi, type Field, type UpsertFieldRequest } from '../api/fields.api'
import { expectQueryData, invalidatedKeys, runMutation } from '../test/utils'
import { FIELDS_KEY, useCreateField, useDeleteField, useFields, useUpdateField } from './useFields'

vi.mock('../api/fields.api')

const field = { id: 'f1', name: 'Lot 1' } as Field
const payload = {
  name: 'Lot 1',
  geometry: { type: 'Polygon', coordinates: [] },
} as UpsertFieldRequest

describe('useFields', () => {
  beforeEach(() => vi.clearAllMocks())

  it('încarcă terenurile', async () => {
    vi.mocked(fieldsApi.getAll).mockResolvedValue([field])
    await expectQueryData(() => useFields(), [field])
  })

  it('mutațiile apelează API-ul și invalidează lista', async () => {
    vi.mocked(fieldsApi.create).mockResolvedValue(field)
    vi.mocked(fieldsApi.update).mockResolvedValue(field)
    vi.mocked(fieldsApi.delete).mockResolvedValue({} as AxiosResponse)

    const created = await runMutation(() => useCreateField(), payload)
    const updated = await runMutation(() => useUpdateField(), { id: 'f1', payload })
    const deleted = await runMutation(() => useDeleteField(), 'f1')
    for (const run of [created, updated, deleted]) {
      expect(invalidatedKeys(run.invalidate)).toEqual([FIELDS_KEY])
    }
    expect(fieldsApi.update).toHaveBeenCalledWith('f1', payload)
    expect(fieldsApi.delete).toHaveBeenCalledWith('f1')
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cropsApi,
  type Crop,
  type FieldCrop,
  type HarvestResult,
  type Season,
} from '../api/crops.api'
import {
  expectQueryData,
  expectQueryDisabled,
  invalidatedKeys,
  runMutation,
  setAuth,
} from '../test/utils'
import {
  CROPS_KEY,
  FIELD_CROPS_KEY,
  SEASONS_KEY,
  useCreateCrop,
  useCreateFieldCrop,
  useCreateSeason,
  useCrops,
  useDeleteCrop,
  useDeleteFieldCrop,
  useDeleteSeason,
  useFieldCrops,
  useRecordHarvest,
  useSeasons,
  useUpdateCrop,
  useUpdateFieldCrop,
  useUpdateSeason,
} from './useCrops'

vi.mock('../api/crops.api')

const season = { id: 1, name: '2026' } as Season
const crop = { id: 1, name: 'Grâu' } as Crop
const fieldCrop = { id: 1, crop_id: 1 } as FieldCrop
const allKeys = [SEASONS_KEY, CROPS_KEY, FIELD_CROPS_KEY, ['reports']]

describe('useCrops', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuth()
  })

  it('încarcă sezoanele, culturile și culturile pe teren', async () => {
    vi.mocked(cropsApi.getSeasons).mockResolvedValue([season])
    vi.mocked(cropsApi.getCrops).mockResolvedValue([crop])
    vi.mocked(cropsApi.getFieldCrops).mockResolvedValue([fieldCrop])
    await expectQueryData(() => useSeasons(), [season])
    await expectQueryData(() => useCrops(), [crop])
    await expectQueryData(() => useFieldCrops({ season_id: 1 }), [fieldCrop])
    expect(cropsApi.getFieldCrops).toHaveBeenCalledWith({ season_id: 1 })
    setAuth(null)
    expectQueryDisabled(() => useSeasons())
    expectQueryDisabled(() => useCrops())
    expectQueryDisabled(() => useFieldCrops())
  })

  it('mutațiile invalidează toate cache-urile legate de culturi', async () => {
    vi.mocked(cropsApi.createSeason).mockResolvedValue(season)
    vi.mocked(cropsApi.updateSeason).mockResolvedValue(season)
    vi.mocked(cropsApi.deleteSeason).mockResolvedValue(undefined)
    vi.mocked(cropsApi.createCrop).mockResolvedValue(crop)
    vi.mocked(cropsApi.updateCrop).mockResolvedValue(crop)
    vi.mocked(cropsApi.deleteCrop).mockResolvedValue(undefined)
    vi.mocked(cropsApi.createFieldCrop).mockResolvedValue(fieldCrop)
    vi.mocked(cropsApi.updateFieldCrop).mockResolvedValue(fieldCrop)
    vi.mocked(cropsApi.deleteFieldCrop).mockResolvedValue(undefined)

    const seasonPayload = {
      name: '2026',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      is_active: true,
      notes: '',
    }
    const cropPayload = { name: 'Grâu', category: 'cereale', yield_unit: 't', notes: '' }
    const fieldCropPayload = { field_id: 'f1', season_id: 1, crop_id: 1, notes: '' }
    const runs = [
      await runMutation(() => useCreateSeason(), seasonPayload),
      await runMutation(() => useUpdateSeason(), { id: 1, payload: seasonPayload }),
      await runMutation(() => useDeleteSeason(), 1),
      await runMutation(() => useCreateCrop(), cropPayload),
      await runMutation(() => useUpdateCrop(), { id: 1, payload: cropPayload }),
      await runMutation(() => useDeleteCrop(), 1),
      await runMutation(() => useCreateFieldCrop(), fieldCropPayload),
      await runMutation(() => useUpdateFieldCrop(), { id: 1, payload: fieldCropPayload }),
      await runMutation(() => useDeleteFieldCrop(), 1),
    ]
    for (const run of runs) {
      expect(invalidatedKeys(run.invalidate)).toEqual(allKeys)
    }
    expect(cropsApi.updateSeason).toHaveBeenCalledWith(1, seasonPayload)
    expect(cropsApi.updateFieldCrop).toHaveBeenCalledWith(1, fieldCropPayload)
  })

  it('înregistrarea recoltei invalidează și stocurile', async () => {
    vi.mocked(cropsApi.recordHarvest).mockResolvedValue({ field_crop: fieldCrop } as HarvestResult)
    const { invalidate } = await runMutation(() => useRecordHarvest(), 1)
    expect(cropsApi.recordHarvest).toHaveBeenCalledWith(1)
    expect(invalidatedKeys(invalidate)).toEqual([
      FIELD_CROPS_KEY,
      CROPS_KEY,
      ['stocks'],
      ['stock-movements'],
      ['resources'],
      ['reports'],
    ])
  })
})

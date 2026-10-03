import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AxiosResponse } from 'axios'
import { auditApi, type AuditEntry } from '../../api/audit.api'
import { profileApi, type UserProfile } from '../../api/profile.api'
import { weatherApi, type CurrentWeather } from '../../api/weather.api'
import {
  expectQueryData,
  expectQueryDisabled,
  invalidatedKeys,
  runMutation,
  setAuth,
} from '../../test/utils'
import { useAuditLog } from '../useAuditLog'
import { PROFILE_KEY, useProfile, useUpdateProfile, useUploadPhoto } from '../useProfile'
import { useCurrentWeather } from '../useWeather'

vi.mock('../../api/audit.api')
vi.mock('../../api/profile.api')
vi.mock('../../api/weather.api')

const profile = { user_id: 1, first_name: 'Ana' } as UserProfile
const response = (data: unknown) => ({ data }) as AxiosResponse

describe('useProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuth()
  })

  it('încarcă profilul doar cu sesiune', async () => {
    vi.mocked(profileApi.get).mockResolvedValue(response(profile))
    await expectQueryData(() => useProfile(), profile)
    setAuth(null)
    expectQueryDisabled(() => useProfile())
  })

  it('actualizarea și încărcarea pozei invalidează profilul', async () => {
    vi.mocked(profileApi.update).mockResolvedValue(response(profile))
    vi.mocked(profileApi.uploadPhoto).mockResolvedValue(response({ profile_photo: 'u' }))
    const updated = await runMutation(() => useUpdateProfile(), {
      first_name: 'Ana',
      last_name: 'Pop',
    })
    expect(updated.data).toEqual(profile)
    expect(invalidatedKeys(updated.invalidate)).toEqual([PROFILE_KEY])
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    const uploaded = await runMutation(() => useUploadPhoto(), file)
    expect(profileApi.uploadPhoto).toHaveBeenCalledWith(file)
    expect(uploaded.data).toEqual({ profile_photo: 'u' })
    expect(invalidatedKeys(uploaded.invalidate)).toEqual([PROFILE_KEY])
  })
})

describe('useCurrentWeather', () => {
  beforeEach(() => vi.clearAllMocks())

  it('încarcă vremea pentru locația implicită și pentru coordonate', async () => {
    const weather = { location: 'Cantemir', temperature_c: 20 } as CurrentWeather
    vi.mocked(weatherApi.getCurrent).mockResolvedValue(weather)
    await expectQueryData(() => useCurrentWeather(), weather)
    expect(weatherApi.getCurrent).toHaveBeenCalledWith(undefined)
    await expectQueryData(
      () => useCurrentWeather({ lat: 46.1234567, lng: 28.1, location: 'Lot' }),
      weather
    )
    expect(weatherApi.getCurrent).toHaveBeenLastCalledWith({
      lat: 46.1234567,
      lng: 28.1,
      location: 'Lot',
    })
  })
})

describe('useAuditLog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuth()
  })

  it('încarcă jurnalul cu parametrii dați, doar cu sesiune', async () => {
    const entries = [{ id: 1 } as AuditEntry]
    vi.mocked(auditApi.getAll).mockResolvedValue(entries)
    await expectQueryData(() => useAuditLog({ limit: 10 }), entries)
    expect(auditApi.getAll).toHaveBeenCalledWith({ limit: 10 })
    setAuth(null)
    expectQueryDisabled(() => useAuditLog())
  })
})

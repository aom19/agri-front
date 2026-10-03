import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  dashboardApi,
  type DashboardActivityItem,
  type DashboardCard,
  type DashboardQuickStats,
} from '../../api/dashboard.api'
import { expectQueryData, expectQueryDisabled, setAuth } from '../../test/utils'
import {
  useDashboardActivity,
  useDashboardCards,
  useDashboardQuickStats,
} from '../useDashboardCards'

vi.mock('../../api/dashboard.api')

describe('useDashboardCards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuth()
  })

  it('încarcă cardurile, statisticile rapide și activitatea', async () => {
    const cards = [{ key: 'total_machines', value: 3 } as DashboardCard]
    const stats = { total_fields: 2 } as DashboardQuickStats
    const activity = [{ id: 1 } as DashboardActivityItem]
    vi.mocked(dashboardApi.getCards).mockResolvedValue(cards)
    vi.mocked(dashboardApi.getQuickStats).mockResolvedValue(stats)
    vi.mocked(dashboardApi.getActivity).mockResolvedValue(activity)
    await expectQueryData(() => useDashboardCards(), cards)
    await expectQueryData(() => useDashboardQuickStats(), stats)
    await expectQueryData(() => useDashboardActivity(3), activity)
    expect(dashboardApi.getActivity).toHaveBeenCalledWith(3)
  })

  it('nu interoghează fără sesiune', () => {
    setAuth(null)
    expectQueryDisabled(() => useDashboardCards())
    expectQueryDisabled(() => useDashboardQuickStats())
    expectQueryDisabled(() => useDashboardActivity())
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  reportsApi,
  reportsExtraApi,
  type ReportCrops,
  type ReportFields,
  type ReportFleet,
  type ReportOperations,
  type ReportOperators,
  type ReportStocks,
  type ReportSubscription,
  type ReportSummary,
  type ReportWeather,
} from '../../api/reports.api'
import {
  expectQueryData,
  expectQueryDisabled,
  invalidatedKeys,
  runMutation,
  setAuth,
} from '../../test/utils'
import {
  REPORT_SUBSCRIPTION_KEY,
  useDeleteReportSubscription,
  useReportCrops,
  useReportFields,
  useReportFleet,
  useReportOperations,
  useReportOperators,
  useReportStocks,
  useReportSubscription,
  useReportSummary,
  useReportWeather,
  useSaveReportSubscription,
  useSendReportNow,
} from '../useReports'

vi.mock('../../api/reports.api')

const filters = { from: '2026-01-01', to: '2026-01-31' }

describe('useReports', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuth()
  })

  it('încarcă fiecare secțiune cu filtrele date', async () => {
    const summary = { period: { from: '2026-01-01' } } as ReportSummary
    vi.mocked(reportsApi.getSummary).mockResolvedValue(summary)
    vi.mocked(reportsApi.getOperations).mockResolvedValue({
      items: [],
    } as unknown as ReportOperations)
    vi.mocked(reportsApi.getFields).mockResolvedValue({ items: [] } as unknown as ReportFields)
    vi.mocked(reportsApi.getFleet).mockResolvedValue({ machines: [] } as unknown as ReportFleet)
    vi.mocked(reportsApi.getOperators).mockResolvedValue({
      items: [],
    } as unknown as ReportOperators)
    vi.mocked(reportsApi.getStocks).mockResolvedValue({ items: [] } as unknown as ReportStocks)
    vi.mocked(reportsExtraApi.getWeather).mockResolvedValue({
      series: [],
    } as unknown as ReportWeather)
    vi.mocked(reportsExtraApi.getCrops).mockResolvedValue({ items: [] } as unknown as ReportCrops)

    await expectQueryData(() => useReportSummary(filters), summary)
    expect(reportsApi.getSummary).toHaveBeenCalledWith(filters)
    await expectQueryData(() => useReportOperations(filters), { items: [] })
    await expectQueryData(() => useReportFields(filters), { items: [] })
    await expectQueryData(() => useReportFleet(filters), { machines: [] })
    await expectQueryData(() => useReportOperators(filters), { items: [] })
    await expectQueryData(() => useReportStocks(filters), { items: [] })
    await expectQueryData(() => useReportWeather(filters), { series: [] })
    await expectQueryData(() => useReportCrops(2, 'f1'), { items: [] })
    expect(reportsExtraApi.getCrops).toHaveBeenCalledWith(2, 'f1')
  })

  it('nu interoghează fără sesiune', () => {
    setAuth(null)
    expectQueryDisabled(() => useReportSummary(filters))
    expectQueryDisabled(() => useReportCrops(undefined, undefined))
    expectQueryDisabled(() => useReportSubscription())
  })

  it('gestionează abonamentul la raport', async () => {
    const subscription = { id: 1, frequency: 'daily' } as ReportSubscription
    vi.mocked(reportsExtraApi.getSubscription).mockResolvedValue(subscription)
    vi.mocked(reportsExtraApi.saveSubscription).mockResolvedValue(subscription)
    vi.mocked(reportsExtraApi.deleteSubscription).mockResolvedValue(undefined)
    vi.mocked(reportsExtraApi.sendNow).mockResolvedValue({ message: 'trimis' })

    await expectQueryData(() => useReportSubscription(), subscription)
    const payload = { frequency: 'daily' as const, send_hour: 7, weekday: 1, is_active: true }
    const saved = await runMutation(() => useSaveReportSubscription(), payload)
    expect(reportsExtraApi.saveSubscription).toHaveBeenCalledWith(payload)
    expect(invalidatedKeys(saved.invalidate)).toEqual([REPORT_SUBSCRIPTION_KEY])
    const deleted = await runMutation(() => useDeleteReportSubscription(), undefined)
    expect(invalidatedKeys(deleted.invalidate)).toEqual([REPORT_SUBSCRIPTION_KEY])
    const sent = await runMutation(() => useSendReportNow(), undefined)
    expect(sent.data).toEqual({ message: 'trimis' })
  })
})

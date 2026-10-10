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
  type ReportSummary,
  type ReportWeather,
} from '../../api/reports.api'
import { expectQueryData, expectQueryDisabled, runMutation, setAuth } from '../../test/utils'
import {
  useEmailReportSummary,
  useReportCrops,
  useReportFields,
  useReportFleet,
  useReportOperations,
  useReportOperators,
  useReportStocks,
  useReportSummary,
  useReportWeather,
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
  })

  it('trimite sumarul perioadei pe e-mail', async () => {
    vi.mocked(reportsExtraApi.emailSummary).mockResolvedValue({ message: 'trimis' })

    const sent = await runMutation(() => useEmailReportSummary(), filters)
    expect(reportsExtraApi.emailSummary).toHaveBeenCalledWith(filters)
    expect(sent.data).toEqual({ message: 'trimis' })
  })
})

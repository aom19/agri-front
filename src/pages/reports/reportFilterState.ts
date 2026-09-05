import { toIsoDate } from './reportUtils'

export type ReportFilterState = {
  from: string
  to: string
  fieldId: string
  operationTypeId: string
  machineId: string
  operatorId: string
}

export type ReportPreset = {
  key: string
  label: string
  range: () => { from: string; to: string }
}

function lastDays(days: number) {
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - (days - 1))
  return { from: toIsoDate(start), to: toIsoDate(today) }
}

export const REPORT_PRESETS: ReportPreset[] = [
  { key: '7d', label: 'Ultimele 7 zile', range: () => lastDays(7) },
  { key: '30d', label: 'Ultimele 30 de zile', range: () => lastDays(30) },
  { key: '90d', label: 'Ultimele 90 de zile', range: () => lastDays(90) },
  {
    key: 'year',
    label: 'Anul curent',
    range: () => {
      const today = new Date()
      return { from: `${today.getFullYear()}-01-01`, to: toIsoDate(today) }
    },
  },
]

export function defaultReportFilterState(): ReportFilterState {
  const { from, to } = lastDays(30)
  return { from, to, fieldId: '', operationTypeId: '', machineId: '', operatorId: '' }
}

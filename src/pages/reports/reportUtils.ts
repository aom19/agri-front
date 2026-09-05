import type { LatLngTuple } from 'leaflet'
import type { GeoJSONPolygon } from '../../api/fields.api'
import type { ReportGranularity } from '../../api/reports.api'
import { fuelTypeOptions, machineTypeOptions } from '../../schemas/machine.schema'
import { implementTypeOptions } from '../../schemas/implement.schema'
import { resourceCategoryOptions } from '../../schemas/resourceType.schema'

// Paletă categorială validată (ordine fixă, niciodată ciclică). Peste 8 serii se pliază în „Altele”.
export const SERIES_COLORS = [
  '#2a78d6',
  '#eb6834',
  '#1baf7a',
  '#eda100',
  '#e87ba4',
  '#008300',
  '#4a3aa7',
  '#e34948',
] as const

// Rampă secvențială (o singură nuanță, deschis -> închis) pentru hartă.
export const SEQUENTIAL_BLUE = [
  '#cde2fb',
  '#9ec5f4',
  '#6da7ec',
  '#3987e5',
  '#256abf',
  '#184f95',
] as const

export const NEUTRAL_INK = '#4a5e54'
export const TRACK_COLOR = '#e0e6e2'

export type StatusMeta = { label: string; color: string }

export const OPERATION_STATUS_META: Record<string, StatusMeta> = {
  planned: { label: 'Planificate', color: '#2a78d6' },
  in_progress: { label: 'În lucru', color: '#eda100' },
  completed: { label: 'Finalizate', color: '#008300' },
  canceled: { label: 'Anulate', color: '#4a3aa7' },
}

export const OPERATION_STATUS_SINGULAR: Record<string, string> = {
  planned: 'Planificată',
  in_progress: 'În lucru',
  completed: 'Finalizată',
  canceled: 'Anulată',
}

export const ASSET_STATUS_META: Record<string, StatusMeta> = {
  active: { label: 'Active', color: '#008300' },
  maintenance: { label: 'În mentenanță', color: '#eda100' },
  inactive: { label: 'Inactive', color: '#4a3aa7' },
}

export const ASSET_STATUS_SINGULAR: Record<string, string> = {
  active: 'Activ',
  maintenance: 'În mentenanță',
  inactive: 'Inactiv',
}

export function seriesColor(index: number) {
  return SERIES_COLORS[Math.min(index, SERIES_COLORS.length - 1)]
}

export function sequentialColor(value: number, max: number) {
  if (max <= 0 || value <= 0) return SEQUENTIAL_BLUE[0]
  const step = Math.min(
    SEQUENTIAL_BLUE.length - 1,
    Math.ceil((value / max) * (SEQUENTIAL_BLUE.length - 1))
  )
  return SEQUENTIAL_BLUE[step]
}

type LabeledOption = ReadonlyArray<{ label: string; value: string }>

function labelFrom(options: LabeledOption, value: string | null | undefined, fallback: string) {
  if (!value) return fallback
  return options.find((option) => option.value === value)?.label ?? value
}

export const machineTypeLabel = (value: string | null | undefined) =>
  labelFrom(machineTypeOptions, value, 'Necunoscut')
export const fuelTypeLabel = (value: string | null | undefined) =>
  value === 'unknown' ? 'Nespecificat' : labelFrom(fuelTypeOptions, value, 'Nespecificat')
export const implementTypeLabel = (value: string | null | undefined) =>
  labelFrom(implementTypeOptions, value, 'Necunoscut')
export const resourceCategoryLabel = (value: string | null | undefined) =>
  labelFrom(resourceCategoryOptions, value, 'Altele')

const integerFormat = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 0 })
const compactFormat = new Intl.NumberFormat('ro-RO', {
  notation: 'compact',
  maximumFractionDigits: 1,
})
const dateTimeFormat = new Intl.DateTimeFormat('ro-RO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
const dateFormat = new Intl.DateTimeFormat('ro-RO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})
const shortDateFormat = new Intl.DateTimeFormat('ro-RO', { day: '2-digit', month: '2-digit' })
const monthFormat = new Intl.DateTimeFormat('ro-RO', { month: 'short', year: 'numeric' })

export function formatInt(value: number | null | undefined) {
  return value == null ? '-' : integerFormat.format(value)
}

export function formatDecimal(value: number | null | undefined, digits = 2) {
  if (value == null) return '-'
  return new Intl.NumberFormat('ro-RO', { maximumFractionDigits: digits }).format(value)
}

export function formatCompact(value: number | null | undefined) {
  if (value == null) return '-'
  return Math.abs(value) < 10000 ? formatDecimal(value, 1) : compactFormat.format(value)
}

export function formatHa(value: number | null | undefined) {
  return value == null ? '-' : `${formatDecimal(value, 1)} ha`
}

export function formatPercent(part: number, total: number) {
  if (total <= 0) return '-'
  return `${Math.round((part / total) * 100)}%`
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : dateTimeFormat.format(date)
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : dateFormat.format(date)
}

// Duratele se exprimă doar în ore și minute, ca în restul aplicației.
export function formatDuration(minutes: number) {
  if (!minutes || minutes <= 0) return '-'
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} min`
  if (rest === 0) return `${hours} h`
  return `${hours} h ${rest} min`
}

export function formatBucket(bucket: string, granularity: ReportGranularity) {
  const date = new Date(`${bucket}T00:00:00`)
  if (Number.isNaN(date.getTime())) return bucket
  if (granularity === 'month') return monthFormat.format(date)
  return shortDateFormat.format(date)
}

export function granularityLabel(granularity: ReportGranularity) {
  if (granularity === 'day') return 'pe zile'
  if (granularity === 'week') return 'pe săptămâni'
  return 'pe luni'
}

export function deltaPercent(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return Math.round(((current - previous) / previous) * 100)
}

export function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function geoJSONToPoints(geometry: GeoJSONPolygon | null | undefined): LatLngTuple[] {
  const outerRing = geometry?.coordinates?.[0] ?? []
  if (outerRing.length === 0) return []

  const withoutClosure = [...outerRing]
  if (outerRing.length > 1) {
    const first = outerRing[0]
    const last = outerRing[outerRing.length - 1]
    if (first[0] === last[0] && first[1] === last[1]) withoutClosure.pop()
  }
  return withoutClosure.map((coordinate) => [coordinate[1], coordinate[0]] as LatLngTuple)
}

export type CsvCell = string | number | null | undefined

export function downloadCsv(filename: string, headers: string[], rows: CsvCell[][]) {
  const escape = (cell: CsvCell) => {
    if (cell == null) return ''
    const text = String(cell)
    return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const lines = [headers, ...rows].map((row) => row.map(escape).join(';'))
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

// Pliază seriile de dincolo de `max` într-o singură intrare „Altele”, ca să nu depășim paleta.
export function foldSeries<T extends { label: string; value: number }>(items: T[], max = 7) {
  if (items.length <= max) return items.map((item) => ({ label: item.label, value: item.value }))
  const kept = items.slice(0, max).map((item) => ({ label: item.label, value: item.value }))
  const rest = items.slice(max).reduce((sum, item) => sum + item.value, 0)
  return [...kept, { label: 'Altele', value: rest }]
}

// Formatează o dată ISO fără oră (YYYY-MM-DD) ca zi calendaristică locală.
export function formatIsoDay(value: string | null | undefined) {
  if (!value) return '-'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? '-' : dateFormat.format(date)
}

// Culoarea unei categorii de resurse urmează entitatea (ordine fixă), nu poziția în grafic.
export function resourceCategoryColor(category: string) {
  const index = resourceCategoryOptions.findIndex((option) => option.value === category)
  return seriesColor(index === -1 ? SERIES_COLORS.length - 1 : index)
}

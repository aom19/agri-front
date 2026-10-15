/** Formatare și parsare numerică pentru paginile de culturi. */
export function formatNumber(value: number | null | undefined, digits = 2) {
  if (value == null) return '-'
  return new Intl.NumberFormat('ro-RO', { maximumFractionDigits: digits }).format(value)
}

export function toOptionalNumber(value: string): number | null {
  if (value.trim() === '') return null
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

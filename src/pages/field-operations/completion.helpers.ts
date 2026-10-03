import type { ConsumptionEstimate } from '../../api/fieldOperation.api'

/** Numărul introdus de utilizator (acceptă virgulă zecimală), sau null dacă e gol ori invalid. */
export function toNumber(value: string): number | null {
  if (value.trim() === '') return null
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

export function formatQuantity(value: number) {
  return new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 3 }).format(value)
}

/**
 * Resursa de combustibil propusă la finalizare: cea din normele șablonului sau, dacă există
 * una singură, singura resursă de combustibil cu stoc.
 */
export function defaultFuelResourceId(estimate: ConsumptionEstimate | undefined): number | null {
  if (!estimate) return null
  const available = new Set(estimate.fuel_resources.map((item) => item.resource_id))
  const fromTemplate = estimate.items.find(
    (item) => item.category === 'fuel' && available.has(item.resource_id)
  )
  if (fromTemplate) return fromTemplate.resource_id
  return estimate.fuel_resources.length === 1 ? estimate.fuel_resources[0].resource_id : null
}

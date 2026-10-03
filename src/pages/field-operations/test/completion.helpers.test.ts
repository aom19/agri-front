import { describe, expect, it } from 'vitest'
import type { ConsumptionEstimate } from '../../../api/fieldOperation.api'
import { defaultFuelResourceId, formatQuantity, toNumber } from '../completion.helpers'

const fuel = (resource_id: number) => ({
  resource_id,
  resource_name: `R${resource_id}`,
  unit: 'l',
  quantity: 1,
})
const norm = (resource_id: number, category: string) => ({
  resource_id,
  resource_name: `R${resource_id}`,
  category,
  unit: 'l',
  quantity_per_unit: 1,
  quantity: 1,
})

describe('completion.helpers', () => {
  it('toNumber acceptă virgula și respinge valorile goale sau invalide', () => {
    expect(toNumber('2,5')).toBe(2.5)
    expect(toNumber(' 10 ')).toBe(10)
    expect(toNumber('')).toBeNull()
    expect(toNumber('abc')).toBeNull()
  })

  it('formatQuantity folosește formatul românesc', () => {
    expect(formatQuantity(1234.5678)).toBe('1.234,568')
  })

  it('defaultFuelResourceId propune combustibilul din șablon, apoi singura resursă', () => {
    const estimate = (items: ConsumptionEstimate['items'], ids: number[]): ConsumptionEstimate => ({
      area_ha: 1,
      items,
      fuel_resources: ids.map(fuel),
    })
    expect(defaultFuelResourceId(undefined)).toBeNull()
    expect(defaultFuelResourceId(estimate([norm(1, 'seed'), norm(6, 'fuel')], [5, 6]))).toBe(6)
    // norma pe o resursă fără stoc de combustibil nu poate fi propusă
    expect(defaultFuelResourceId(estimate([norm(9, 'fuel')], [5]))).toBe(5)
    expect(defaultFuelResourceId(estimate([], [5, 6]))).toBeNull()
    expect(defaultFuelResourceId(estimate([], []))).toBeNull()
  })
})

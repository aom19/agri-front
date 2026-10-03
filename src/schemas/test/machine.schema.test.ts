import { describe, expect, it } from 'vitest'
import {
  fuelTypeOptions,
  machineFormSchema,
  machineStatusOptions,
  machineTypeOptions,
  machineTypeValues,
} from '../machine.schema'

const valid = {
  name: ' Tractor ',
  code: 'TR-1',
  type: 'tractor',
  brand: '',
  model: '',
  year: '2020',
  registrationNumber: '',
  fuelType: 'diesel',
  status: 'active',
  notes: '',
}

describe('machine.schema', () => {
  it('acceptă un formular valid și curăță spațiile', () => {
    const result = machineFormSchema.safeParse(valid)
    expect(result.success).toBe(true)
    expect(result.data!.name).toBe('Tractor')
  })

  it('respinge câmpurile obligatorii goale și enumerările invalide', () => {
    const result = machineFormSchema.safeParse({
      ...valid,
      name: ' ',
      code: '',
      type: 'barca',
      fuelType: 'x',
      status: 'y',
    })
    expect(result.success).toBe(false)
    const paths = result.error!.issues.map((i) => i.path[0])
    expect(paths).toEqual(expect.arrayContaining(['name', 'code', 'type', 'fuelType', 'status']))
  })

  it('validează anul: întreg, între 1900 și anul curent, sau gol', () => {
    expect(machineFormSchema.safeParse({ ...valid, year: '' }).success).toBe(true)
    expect(machineFormSchema.safeParse({ ...valid, year: '20a' }).success).toBe(false)
    expect(machineFormSchema.safeParse({ ...valid, year: '1800' }).success).toBe(false)
    expect(
      machineFormSchema.safeParse({ ...valid, year: String(new Date().getFullYear() + 1) }).success
    ).toBe(false)
  })

  it('expune opțiunile pentru fiecare valoare', () => {
    expect(machineTypeOptions.map((o) => o.value)).toEqual([...machineTypeValues])
    expect(machineStatusOptions).toHaveLength(3)
    expect(fuelTypeOptions[0]).toEqual({ label: 'Nespecificat', value: '' })
  })
})

import { describe, expect, it } from 'vitest'
import {
  implementFormSchema,
  implementStatusOptions,
  implementTypeOptions,
  implementTypeValues,
} from '../implement.schema'

const valid = {
  name: 'Plug',
  code: 'PL-1',
  type: 'plow',
  brand: '',
  model: '',
  year: '',
  workingWidth: '3.5',
  capacity: '',
  status: 'active',
  notes: ' n ',
}

describe('implement.schema', () => {
  it('acceptă un formular valid', () => {
    const result = implementFormSchema.safeParse(valid)
    expect(result.success).toBe(true)
    expect(result.data!.notes).toBe('n')
  })

  it('respinge valorile obligatorii lipsă și enumerările invalide', () => {
    const result = implementFormSchema.safeParse({
      ...valid,
      name: '',
      code: '',
      type: 'x',
      status: 'y',
    })
    expect(result.success).toBe(false)
    expect(result.error!.issues.map((i) => i.path[0])).toEqual(
      expect.arrayContaining(['name', 'code', 'type', 'status'])
    )
  })

  it('validează anul, lățimea de lucru și capacitatea', () => {
    expect(implementFormSchema.safeParse({ ...valid, year: 'abc' }).success).toBe(false)
    expect(implementFormSchema.safeParse({ ...valid, year: '1500' }).success).toBe(false)
    expect(implementFormSchema.safeParse({ ...valid, year: '2000' }).success).toBe(true)
    expect(implementFormSchema.safeParse({ ...valid, workingWidth: 'x' }).success).toBe(false)
    expect(implementFormSchema.safeParse({ ...valid, workingWidth: '0' }).success).toBe(false)
    expect(implementFormSchema.safeParse({ ...valid, capacity: 'x' }).success).toBe(false)
    expect(implementFormSchema.safeParse({ ...valid, capacity: '-1' }).success).toBe(false)
    expect(implementFormSchema.safeParse({ ...valid, capacity: '10' }).success).toBe(true)
  })

  it('expune opțiunile pentru fiecare valoare', () => {
    expect(implementTypeOptions.map((o) => o.value)).toEqual([...implementTypeValues])
    expect(implementStatusOptions.map((o) => o.value)).toEqual([
      'active',
      'maintenance',
      'inactive',
    ])
  })
})

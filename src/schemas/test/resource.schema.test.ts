import { describe, expect, it } from 'vitest'
import { resourceFormSchema } from '../resource.schema'
import {
  resourceCategoryOptions,
  resourceCategoryValues,
  resourceTypeFormSchema,
} from '../resourceType.schema'

describe('resource.schema', () => {
  const valid = {
    name: 'Motorină',
    resourceTypeId: '1',
    pricePerUnit: '7.5',
    quantity: '10',
    minimumQuantity: '0',
    notes: '',
  }

  it('validează resursa și prețul', () => {
    expect(resourceFormSchema.safeParse(valid).success).toBe(true)
    expect(resourceFormSchema.safeParse({ ...valid, pricePerUnit: '' }).success).toBe(false)
    expect(resourceFormSchema.safeParse({ ...valid, pricePerUnit: 'abc' }).success).toBe(false)
    expect(resourceFormSchema.safeParse({ ...valid, pricePerUnit: '-1' }).success).toBe(false)
    expect(resourceFormSchema.safeParse({ ...valid, name: '', resourceTypeId: '' }).success).toBe(
      false
    )
  })
})

describe('resourceType.schema', () => {
  it('validează categoria și unitatea implicită', () => {
    expect(
      resourceTypeFormSchema.safeParse({ name: 'Combustibil', category: 'fuel', defaultUnit: 'l' })
        .success
    ).toBe(true)
    const result = resourceTypeFormSchema.safeParse({ name: '', category: 'gaz', defaultUnit: '' })
    expect(result.success).toBe(false)
    expect(result.error!.issues.map((i) => i.path[0])).toEqual(['name', 'category', 'defaultUnit'])
    expect(resourceCategoryOptions.map((o) => o.value)).toEqual([...resourceCategoryValues])
  })
})

describe('resource.schema – stocul', () => {
  const valid = {
    name: 'Motorină',
    resourceTypeId: '1',
    pricePerUnit: '7.5',
    quantity: '10',
    minimumQuantity: '0',
    notes: '',
  }

  it('validează cantitățile ca numere >= 0', () => {
    const result = resourceFormSchema.safeParse({ ...valid, quantity: 'x', minimumQuantity: '-1' })
    expect(result.success).toBe(false)
    // zod raportează toate regulile eșuate ale unui câmp, nu doar prima
    expect(result.error!.issues.map((i) => i.message)).toEqual([
      'Cantitatea trebuie să fie numerică.',
      'Cantitatea trebuie să fie mai mare sau egală cu 0.',
      'Cantitatea minimă trebuie să fie mai mare sau egală cu 0.',
    ])
    expect(resourceFormSchema.safeParse({ ...valid, quantity: '' }).success).toBe(false)
  })
})

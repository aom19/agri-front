import { describe, expect, it } from 'vitest'
import { resourceFormSchema } from './resource.schema'
import {
  resourceCategoryOptions,
  resourceCategoryValues,
  resourceTypeFormSchema,
} from './resourceType.schema'
import { stockFormSchema } from './stock.schema'

describe('resource.schema', () => {
  const valid = { name: 'Motorină', resourceTypeId: '1', pricePerUnit: '7.5', notes: '' }

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

describe('stock.schema', () => {
  it('validează cantitățile ca numere >= 0', () => {
    expect(
      stockFormSchema.safeParse({ resourceId: '1', quantity: '10', minimumQuantity: '0' }).success
    ).toBe(true)
    const result = stockFormSchema.safeParse({
      resourceId: '',
      quantity: 'x',
      minimumQuantity: '-1',
    })
    expect(result.success).toBe(false)
    // zod raportează toate regulile eșuate ale unui câmp, nu doar prima
    expect(result.error!.issues.map((i) => i.message)).toEqual([
      'Resursa este obligatorie.',
      'Cantitatea trebuie să fie numerică.',
      'Cantitatea trebuie să fie mai mare sau egală cu 0.',
      'Cantitatea minimă trebuie să fie mai mare sau egală cu 0.',
    ])
    expect(
      stockFormSchema.safeParse({ resourceId: '1', quantity: '', minimumQuantity: '0' }).success
    ).toBe(false)
  })
})

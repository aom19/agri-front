import { describe, expect, it } from 'vitest'
import {
  isOperationType,
  operationTemplateFormSchema,
  operationTypeLabel,
  operationTypeOptions,
  operationTypeValues,
} from '../operation.schema'

describe('operation.schema', () => {
  it('fiecare tip de operațiune are o etichetă', () => {
    expect(operationTypeOptions.map((o) => o.value)).toEqual([...operationTypeValues])
    expect(operationTypeLabel('seeding')).toBe('Semănat')
    expect(operationTypeLabel('plowing')).toBe('plowing')
    expect(operationTypeLabel(null)).toBe('')
    expect(isOperationType('harvesting')).toBe(true)
    expect(isOperationType('3')).toBe(false)
  })

  it('validează template-ul', () => {
    const valid = {
      name: 'Arat standard',
      operationType: 'soil_preparation',
      unit: 'ha',
      description: '',
      cropId: '',
    }
    expect(operationTemplateFormSchema.safeParse(valid).success).toBe(true)
    const result = operationTemplateFormSchema.safeParse({
      ...valid,
      name: '',
      operationType: '',
      unit: ' ',
    })
    expect(result.success).toBe(false)
    expect(result.error!.issues.map((i) => i.path[0])).toEqual(['name', 'operationType', 'unit'])
    expect(result.error!.issues[1].message).toBe('Tipul operațiunii este obligatoriu.')
    expect(
      operationTemplateFormSchema.safeParse({ ...valid, operationType: 'plowing' }).success
    ).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { operationTemplateFormSchema, operationTypeFormSchema } from './operation.schema'

describe('operation.schema', () => {
  it('validează tipul de operațiune (cod cu litere mici și underscore)', () => {
    expect(
      operationTypeFormSchema.safeParse({ code: 'arat_adanc', name: 'Arat', description: '' })
        .success
    ).toBe(true)
    const result = operationTypeFormSchema.safeParse({ code: 'Arat-1', name: '', description: '' })
    expect(result.success).toBe(false)
    expect(result.error!.issues.map((i) => i.message)).toEqual([
      'Codul trebuie să conțină doar litere mici și underscore.',
      'Numele este obligatoriu.',
    ])
    expect(
      operationTypeFormSchema.safeParse({ code: '', name: 'x', description: '' }).success
    ).toBe(false)
  })

  it('validează template-ul', () => {
    const valid = {
      name: 'Arat standard',
      operationTypeId: '1',
      unit: 'ha',
      description: '',
      cropId: '',
    }
    expect(operationTemplateFormSchema.safeParse(valid).success).toBe(true)
    const result = operationTemplateFormSchema.safeParse({
      ...valid,
      name: '',
      operationTypeId: '',
      unit: ' ',
    })
    expect(result.success).toBe(false)
    expect(result.error!.issues.map((i) => i.path[0])).toEqual(['name', 'operationTypeId', 'unit'])
  })
})

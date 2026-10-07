import { describe, expect, it } from 'vitest'
import { operatorFormSchema, operatorStatusOptions } from '../operator.schema'

const valid = {
  first_name: 'Ion',
  last_name: '',
  phone: '+40 700 000 000',
  email: 'ion@x.ro',
  notes: '',
}

describe('operator.schema', () => {
  it('acceptă un operator valid, cu telefon și email opționale', () => {
    expect(operatorFormSchema.safeParse(valid).success).toBe(true)
    expect(operatorFormSchema.safeParse({ ...valid, phone: '', email: '' }).success).toBe(true)
  })

  it('respinge prenumele lipsă, telefonul și emailul invalide', () => {
    const result = operatorFormSchema.safeParse({
      ...valid,
      first_name: ' ',
      phone: 'abc',
      email: 'nu',
    })
    expect(result.success).toBe(false)
    expect(result.error!.issues.map((i) => i.path[0])).toEqual(['first_name', 'phone', 'email'])
  })

  it('are statusurile activ și inactiv', () => {
    expect(operatorStatusOptions.map((o) => o.value)).toEqual(['active', 'inactive'])
  })
})

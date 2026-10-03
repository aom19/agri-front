import { describe, expect, it } from 'vitest'
import { operatorFormSchema, operatorStatusOptions } from '../operator.schema'

const valid = {
  name: 'Ion',
  phone: '+40 700 000 000',
  email: 'ion@x.ro',
  notes: '',
  allowed_machine_types: ['tractor'],
}

describe('operator.schema', () => {
  it('acceptă un operator valid, cu telefon și email opționale', () => {
    expect(operatorFormSchema.safeParse(valid).success).toBe(true)
    expect(operatorFormSchema.safeParse({ ...valid, phone: '', email: '' }).success).toBe(true)
  })

  it('respinge numele lipsă, telefonul și emailul invalide', () => {
    const result = operatorFormSchema.safeParse({ ...valid, name: ' ', phone: 'abc', email: 'nu' })
    expect(result.success).toBe(false)
    expect(result.error!.issues.map((i) => i.path[0])).toEqual(['name', 'phone', 'email'])
  })

  it('respinge tipurile de mașini necunoscute', () => {
    expect(
      operatorFormSchema.safeParse({ ...valid, allowed_machine_types: ['barca'] }).success
    ).toBe(false)
    expect(operatorStatusOptions.map((o) => o.value)).toEqual(['active', 'inactive'])
  })
})

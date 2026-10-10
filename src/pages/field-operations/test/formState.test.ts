import { describe, expect, it } from 'vitest'
import type { FieldOperation } from '../../../api/fieldOperation.api'
import {
  fieldOperationToFormState,
  formStateToPayload,
  initialFieldOperationFormState,
  validateFieldOperation,
} from '../formState'

describe('formState', () => {
  it('trimite tipul propriu doar pentru operațiunea fără template', () => {
    const manual = {
      ...initialFieldOperationFormState,
      field_id: 'f1',
      operation_type: 'seeding' as const,
    }
    expect(formStateToPayload(manual)).toMatchObject({
      operation_type: 'seeding',
      operation_template_id: null,
    })
    expect(formStateToPayload({ ...manual, operation_template_id: '3' })).toMatchObject({
      operation_type: null,
      operation_template_id: 3,
    })
  })

  it('tipul e obligatoriu în formular', () => {
    expect(validateFieldOperation({ ...initialFieldOperationFormState, field_id: 'f1' })).toEqual({
      operation_type: 'Alege tipul operațiunii.',
    })
  })

  it('o operațiune cu template se deschide cu tipul template-ului', () => {
    const item = {
      field_id: 'f1',
      operation_type: 'spraying',
      operation_template_id: 3,
      notes: '',
      status: 'planned',
    } as FieldOperation
    expect(fieldOperationToFormState(item)).toMatchObject({
      operation_type: 'spraying',
      operation_template_id: '3',
    })
  })
})

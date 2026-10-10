import { z } from 'zod'

// Aceleași coduri și nume ca domain.OperationType din agri-api.
export const operationTypeValues = [
  'soil_preparation',
  'seeding',
  'fertilization',
  'spraying',
  'harvesting',
  'irrigation',
] as const

export type OperationTypeValue = (typeof operationTypeValues)[number]

export const operationTypeOptions: ReadonlyArray<{ label: string; value: OperationTypeValue }> = [
  { label: 'Pregătire sol', value: 'soil_preparation' },
  { label: 'Semănat', value: 'seeding' },
  { label: 'Fertilizare', value: 'fertilization' },
  { label: 'Stropire', value: 'spraying' },
  { label: 'Recoltare', value: 'harvesting' },
  { label: 'Irigare', value: 'irrigation' },
]

export const isOperationType = (value: string): value is OperationTypeValue =>
  (operationTypeValues as readonly string[]).includes(value)

export const operationTypeLabel = (value: string | null | undefined) =>
  operationTypeOptions.find((option) => option.value === value)?.label ?? value ?? ''

export const operationTemplateFormSchema = z.object({
  name: z.string().trim().min(1, 'Numele template-ului este obligatoriu.'),
  operationType: z.enum(operationTypeValues, { message: 'Tipul operațiunii este obligatoriu.' }),
  unit: z.string().trim().min(1, 'Unitatea de lucru este obligatorie.'),
  description: z.string().trim(),
  cropId: z.string().trim(),
})

// în formular tipul poate fi încă nealeas ('')
export type OperationTemplateFormValues = Omit<
  z.infer<typeof operationTemplateFormSchema>,
  'operationType'
> & { operationType: OperationTypeValue | '' }
export type OperationTemplateFormErrors = Partial<Record<keyof OperationTemplateFormValues, string>>

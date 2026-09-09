import { z } from 'zod'

export const operationTypeFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Codul este obligatoriu.')
    .regex(/^[a-z_]+$/, 'Codul trebuie să conțină doar litere mici și underscore.'),
  name: z.string().trim().min(1, 'Numele este obligatoriu.'),
  description: z.string().trim(),
})

export type OperationTypeFormValues = z.infer<typeof operationTypeFormSchema>
export type OperationTypeFormErrors = Partial<Record<keyof OperationTypeFormValues, string>>

export const operationTemplateFormSchema = z.object({
  name: z.string().trim().min(1, 'Numele template-ului este obligatoriu.'),
  operationTypeId: z.string().trim().min(1, 'Tipul operațiunii este obligatoriu.'),
  unit: z.string().trim().min(1, 'Unitatea de lucru este obligatorie.'),
  description: z.string().trim(),
  cropId: z.string().trim(),
})

export type OperationTemplateFormValues = z.infer<typeof operationTemplateFormSchema>
export type OperationTemplateFormErrors = Partial<Record<keyof OperationTemplateFormValues, string>>

import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowBackOutlined } from '@mui/icons-material'
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useHasPermission } from '../../hooks/usePermissions'
import { useFields } from '../../hooks/useFields'
import { useMachines } from '../../hooks/useMachines'
import { useImplements } from '../../hooks/useImplements'
import { useOperators } from '../../hooks/useOperators'
import { useOperationTemplates, useOperationTypes } from '../../hooks/useOperations'
import { useFieldCrops } from '../../hooks/useCrops'
import {
  useCreateFieldOperation,
  useFieldOperation,
  useUpdateFieldOperation,
} from '../../hooks/useFieldOperations'
import { useNotificationStore } from '../../store/notification.store'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import { FieldOperationForm } from './components'
import {
  fieldOperationToFormState,
  formStateToPayload,
  initialFieldOperationFormState,
  validateFieldOperation,
  type FieldOperationFormErrors,
  type FieldOperationFormMode,
  type FieldOperationFormState,
} from './formState'

type Props = {
  mode: FieldOperationFormMode
}

export default function FieldOperationFormPage({ mode }: Props) {
  const params = useParams<{ id: string }>()
  const navigate = useNavigate()
  const show = useNotificationStore((s) => s.show)
  const canWrite = useHasPermission('field_operations:write')

  const id = params.id ? Number(params.id) : null
  const isEdit = mode === 'edit'
  const isView = mode === 'view'
  const isCreate = mode === 'create'

  const { data: existing, isPending: loadingExisting } = useFieldOperation(isCreate ? null : id)

  const { data: fields } = useFields()
  const { data: machines } = useMachines()
  const { data: implementsData } = useImplements()
  const { data: operators } = useOperators()
  const { data: operationTypes } = useOperationTypes()
  const { data: templates } = useOperationTemplates()
  const { data: fieldCrops } = useFieldCrops()

  const createMutation = useCreateFieldOperation()
  const updateMutation = useUpdateFieldOperation()
  const submitting = createMutation.isPending || updateMutation.isPending

  const [formState, setFormState] = useState<FieldOperationFormState>(
    initialFieldOperationFormState
  )
  const [formErrors, setFormErrors] = useState<FieldOperationFormErrors>({})
  const [loadedId, setLoadedId] = useState<number | null>(null)

  if (existing && existing.id !== loadedId) {
    setLoadedId(existing.id)
    setFormState(fieldOperationToFormState(existing))
  }

  const title = useMemo(() => {
    if (isView) return 'Detalii operațiune'
    if (isEdit) return 'Editează operațiunea'
    return 'Operațiune nouă'
  }, [isEdit, isView])

  const goBack = () => navigate('/field-operations')

  const handleSubmit = async () => {
    const errors = validateFieldOperation(formState)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      show('Verifică datele introduse.', 'warning')
      return
    }
    setFormErrors({})
    const payload = formStateToPayload(formState)
    try {
      if (isCreate) {
        await createMutation.mutateAsync(payload)
        show('Operațiunea a fost creată.', 'success')
      } else if (isEdit && id != null) {
        await updateMutation.mutateAsync({ id, payload })
        show('Operațiunea a fost actualizată.', 'success')
      }
      goBack()
    } catch (error) {
      show(getApiErrorMessage(error, 'Nu am putut salva operațiunea.'), 'error')
    }
  }

  const loading = !isCreate && loadingExisting

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto', width: '100%' }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
        <Tooltip title="Înapoi la listă">
          <IconButton onClick={goBack} aria-label="Înapoi">
            <ArrowBackOutlined />
          </IconButton>
        </Tooltip>
        <Typography sx={{ fontSize: '1.35rem', fontWeight: 700, color: '#0d1f17' }}>
          {title}
        </Typography>
      </Stack>

      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <>
            <FieldOperationForm
              mode={mode}
              state={formState}
              errors={formErrors}
              fields={fields ?? []}
              operationTypes={operationTypes ?? []}
              operationTemplates={templates ?? []}
              machines={machines ?? []}
              implementItems={implementsData ?? []}
              operators={operators ?? []}
              fieldCrops={fieldCrops ?? []}
              onChange={setFormState}
            />

            <Stack direction="row" spacing={1.5} sx={{ mt: 3, justifyContent: 'flex-end' }}>
              <Button onClick={goBack} disabled={submitting}>
                {isView ? 'Închide' : 'Anulează'}
              </Button>
              {!isView && canWrite && (
                <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Se salvează…' : isEdit ? 'Salvează' : 'Creează'}
                </Button>
              )}
            </Stack>
          </>
        )}
      </Paper>
    </Box>
  )
}

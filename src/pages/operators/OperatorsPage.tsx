import { useMemo, useState } from 'react'
import { SearchOutlined } from '@mui/icons-material'
import { Box, CircularProgress, InputAdornment, TextField } from '@mui/material'
import { ModalConfirmAction } from '../../components'
import { useHasPermission } from '../../hooks/usePermissions'
import {
  useCreateOperator,
  useDeleteOperator,
  useDisableOperator,
  useEnableOperator,
  useOperators,
  useUpdateOperator,
} from '../../hooks/useOperators'
import type { Operator } from '../../api/operator.api'
import { useNotificationStore } from '../../store/notification.store'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import {
  operatorFormSchema,
  type OperatorFormErrors,
  type OperatorFormValues,
} from '../../schemas/operator.schema'
import { OperatorFormModal, OperatorsPageHeader, OperatorsTable } from './components'

type FormMode = 'create' | 'edit' | 'view'

const initialFormState: OperatorFormValues = {
  name: '',
  phone: '',
  email: '',
  notes: '',
}

function mapOperatorToFormState(operator: Operator): OperatorFormValues {
  return {
    name: operator.name,
    phone: operator.phone ?? '',
    email: operator.email ?? '',
    notes: operator.notes ?? '',
  }
}

export default function OperatorsPage() {
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null)
  const [formState, setFormState] = useState<OperatorFormValues>(initialFormState)
  const [formErrors, setFormErrors] = useState<OperatorFormErrors>({})
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [operatorToDelete, setOperatorToDelete] = useState<Operator | null>(null)

  const show = useNotificationStore((state) => state.show)
  const canWrite = useHasPermission('operators:write')
  const canDelete = useHasPermission('operators:delete')
  const canDisable = useHasPermission('operators:disable')

  const { data: operators, isPending } = useOperators()
  const createOperator = useCreateOperator()
  const updateOperator = useUpdateOperator()
  const deleteOperator = useDeleteOperator()
  const disableOperator = useDisableOperator()
  const enableOperator = useEnableOperator()

  const submitting = createOperator.isPending || updateOperator.isPending
  const deleting = deleteOperator.isPending

  const filteredOperators = useMemo(() => {
    const value = search.trim().toLowerCase()
    return [...(operators ?? [])]
      .filter((operator) => {
        if (!value) return true
        return (
          operator.name.toLowerCase().includes(value) ||
          operator.phone?.toLowerCase().includes(value) ||
          operator.email?.toLowerCase().includes(value)
        )
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'ro'))
  }, [operators, search])

  const openCreateDialog = () => {
    setSelectedOperator(null)
    setFormMode('create')
    setFormState(initialFormState)
    setFormErrors({})
    setFormOpen(true)
  }

  const openEditDialog = (operator: Operator) => {
    setSelectedOperator(operator)
    setFormMode('edit')
    setFormState(mapOperatorToFormState(operator))
    setFormErrors({})
    setFormOpen(true)
  }

  const openViewDialog = (operator: Operator) => {
    setSelectedOperator(operator)
    setFormMode('view')
    setFormState(mapOperatorToFormState(operator))
    setFormErrors({})
    setFormOpen(true)
  }

  const closeFormDialog = () => {
    if (submitting) return
    setFormOpen(false)
    setFormErrors({})
  }

  const openDeleteDialog = (operator: Operator) => {
    setOperatorToDelete(operator)
    setDeleteOpen(true)
  }

  const closeDeleteDialog = () => {
    if (deleting) return
    setDeleteOpen(false)
    setOperatorToDelete(null)
  }

  const handleSubmit = async () => {
    const validation = operatorFormSchema.safeParse(formState)
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors
      const nextErrors: OperatorFormErrors = {}

      if (fieldErrors.name?.[0]) nextErrors.name = fieldErrors.name[0]
      if (fieldErrors.phone?.[0]) nextErrors.phone = fieldErrors.phone[0]
      if (fieldErrors.email?.[0]) nextErrors.email = fieldErrors.email[0]
      if (fieldErrors.notes?.[0]) nextErrors.notes = fieldErrors.notes[0]

      setFormErrors(nextErrors)
      show('Verifică datele introduse în formular.', 'warning')
      return
    }

    setFormErrors({})
    const parsedValues = validation.data
    const payload = {
      name: parsedValues.name,
      phone: parsedValues.phone,
      email: parsedValues.email,
      notes: parsedValues.notes,
    }

    try {
      if (formMode === 'create') {
        await createOperator.mutateAsync(payload)
        show('Operatorul a fost creat.', 'success')
      } else if (formMode === 'edit' && selectedOperator) {
        await updateOperator.mutateAsync({ id: String(selectedOperator.id), payload })
        show('Operatorul a fost actualizat.', 'success')
      }
      setFormOpen(false)
    } catch (error) {
      show(getApiErrorMessage(error, 'Nu am putut salva operatorul.'), 'error')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!operatorToDelete) return

    try {
      await deleteOperator.mutateAsync(String(operatorToDelete.id))
      show('Operatorul a fost șters.', 'success')
      closeDeleteDialog()
    } catch (error) {
      show(getApiErrorMessage(error, 'Nu am putut șterge operatorul.'), 'error')
    }
  }

  const handleDisable = async (operator: Operator) => {
    try {
      await disableOperator.mutateAsync(String(operator.id))
      show(`Operatorul „${operator.name}" a fost dezactivat.`, 'success')
    } catch (error) {
      show(getApiErrorMessage(error, 'Nu am putut dezactiva operatorul.'), 'error')
    }
  }

  const handleEnable = async (operator: Operator) => {
    try {
      await enableOperator.mutateAsync(String(operator.id))
      show(`Operatorul „${operator.name}" a fost reactivat.`, 'success')
    } catch (error) {
      show(getApiErrorMessage(error, 'Nu am putut reactiva operatorul.'), 'error')
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <OperatorsPageHeader onCreate={openCreateDialog} canWrite={canWrite} />

      <Box sx={{ mb: 2 }}>
        <TextField
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          label="Caută operator"
          placeholder="după nume, telefon sau email"
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {isPending ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <OperatorsTable
          operators={filteredOperators}
          isLoading={isPending}
          canWrite={canWrite}
          canDelete={canDelete}
          canDisable={canDisable}
          onView={openViewDialog}
          onEdit={openEditDialog}
          onDelete={openDeleteDialog}
          onDisable={handleDisable}
          onEnable={handleEnable}
        />
      )}

      <OperatorFormModal
        open={formOpen}
        mode={formMode}
        formState={formState}
        errors={formErrors}
        submitting={submitting}
        onClose={closeFormDialog}
        onSubmit={handleSubmit}
        onChange={setFormState}
      />

      <ModalConfirmAction
        open={deleteOpen}
        title="Șterge operator"
        description={
          operatorToDelete ? `Confirmi ștergerea operatorului „${operatorToDelete.name}"?` : ''
        }
        confirmText="Șterge"
        loading={deleting}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
      />
    </Box>
  )
}

import { useMemo, useState } from 'react'
import { SearchOutlined } from '@mui/icons-material'
import { Box, CircularProgress, InputAdornment, TextField } from '@mui/material'
import { ModalConfirmAction } from '../../components'
import {
  useActivateImplement,
  useCreateImplement,
  useDeactivateImplement,
  useDeleteImplement,
  useImplements,
  useUpdateImplement,
} from '../../hooks/useImplements'
import { useHasPermission } from '../../hooks/usePermissions'
import type { Implement } from '../../api/implement.api'
import { useNotificationStore } from '../../store/notification.store'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import {
  implementFormSchema,
  implementStatusValues,
  implementTypeValues,
  type ImplementFormErrors,
  type ImplementFormValues,
} from '../../schemas/implement.schema'
import { ImplementFormModal, ImplementsPageHeader, ImplementsTable } from './components'

type FormMode = 'create' | 'edit' | 'view'

type ImplementFormState = ImplementFormValues

const initialFormState: ImplementFormState = {
  name: '',
  code: '',
  type: 'plow',
  brand: '',
  model: '',
  year: '',
  workingWidth: '',
  capacity: '',
  status: 'active',
  notes: '',
}

function mapImplementToFormState(implementData: Implement): ImplementFormState {
  const safeType = implementTypeValues.includes(
    implementData.type as (typeof implementTypeValues)[number]
  )
    ? (implementData.type as (typeof implementTypeValues)[number])
    : 'other'

  const safeStatus = implementStatusValues.includes(
    implementData.status as (typeof implementStatusValues)[number]
  )
    ? (implementData.status as (typeof implementStatusValues)[number])
    : 'active'

  return {
    name: implementData.name,
    code: implementData.code,
    type: safeType,
    brand: implementData.brand ?? '',
    model: implementData.model ?? '',
    year: implementData.year == null ? '' : String(implementData.year),
    workingWidth: implementData.working_width == null ? '' : String(implementData.working_width),
    capacity: implementData.capacity == null ? '' : String(implementData.capacity),
    status: safeStatus,
    notes: implementData.notes ?? '',
  }
}

export default function ImplementsPage() {
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [selectedImplement, setSelectedImplement] = useState<Implement | null>(null)
  const [formState, setFormState] = useState<ImplementFormState>(initialFormState)
  const [formErrors, setFormErrors] = useState<ImplementFormErrors>({})
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [implementToDelete, setImplementToDelete] = useState<Implement | null>(null)
  const [toggleOpen, setToggleOpen] = useState(false)
  const [implementToToggle, setImplementToToggle] = useState<Implement | null>(null)

  const show = useNotificationStore((state) => state.show)
  const canWrite = useHasPermission('implements:write')
  const canDelete = useHasPermission('implements:delete')

  const { data: implementsData, isPending } = useImplements()
  const createImplement = useCreateImplement()
  const updateImplement = useUpdateImplement()
  const deactivateImplement = useDeactivateImplement()
  const activateImplement = useActivateImplement()
  const deleteImplement = useDeleteImplement()

  const submitting = createImplement.isPending || updateImplement.isPending
  const deleting = deleteImplement.isPending
  const toggling = deactivateImplement.isPending || activateImplement.isPending

  const filteredImplements = useMemo(() => {
    const value = search.trim().toLowerCase()
    return [...(implementsData ?? [])]
      .filter((implementData) => {
        if (!value) return true
        return (
          implementData.name.toLowerCase().includes(value) ||
          implementData.code.toLowerCase().includes(value) ||
          implementData.type.toLowerCase().includes(value) ||
          implementData.brand?.toLowerCase().includes(value) ||
          implementData.model?.toLowerCase().includes(value)
        )
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'ro'))
  }, [implementsData, search])

  const openCreateDialog = () => {
    setSelectedImplement(null)
    setFormMode('create')
    setFormState(initialFormState)
    setFormErrors({})
    setFormOpen(true)
  }

  const openEditDialog = (implementData: Implement) => {
    setSelectedImplement(implementData)
    setFormMode('edit')
    setFormState(mapImplementToFormState(implementData))
    setFormErrors({})
    setFormOpen(true)
  }

  const openViewDialog = (implementData: Implement) => {
    setSelectedImplement(implementData)
    setFormMode('view')
    setFormState(mapImplementToFormState(implementData))
    setFormErrors({})
    setFormOpen(true)
  }

  const closeFormDialog = () => {
    if (submitting) return
    setFormOpen(false)
    setFormErrors({})
  }

  const openDeleteDialog = (implementData: Implement) => {
    setImplementToDelete(implementData)
    setDeleteOpen(true)
  }

  const closeDeleteDialog = () => {
    if (deleting) return
    setDeleteOpen(false)
    setImplementToDelete(null)
  }

  const openToggleDialog = (implementData: Implement) => {
    setImplementToToggle(implementData)
    setToggleOpen(true)
  }

  const closeToggleDialog = () => {
    if (toggling) return
    setToggleOpen(false)
    setImplementToToggle(null)
  }

  const handleSubmit = async () => {
    const validation = implementFormSchema.safeParse(formState)
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors
      const nextErrors: ImplementFormErrors = {}

      if (fieldErrors.name?.[0]) nextErrors.name = fieldErrors.name[0]
      if (fieldErrors.code?.[0]) nextErrors.code = fieldErrors.code[0]
      if (fieldErrors.type?.[0]) nextErrors.type = fieldErrors.type[0]
      if (fieldErrors.brand?.[0]) nextErrors.brand = fieldErrors.brand[0]
      if (fieldErrors.model?.[0]) nextErrors.model = fieldErrors.model[0]
      if (fieldErrors.year?.[0]) nextErrors.year = fieldErrors.year[0]
      if (fieldErrors.workingWidth?.[0]) nextErrors.workingWidth = fieldErrors.workingWidth[0]
      if (fieldErrors.capacity?.[0]) nextErrors.capacity = fieldErrors.capacity[0]
      if (fieldErrors.status?.[0]) nextErrors.status = fieldErrors.status[0]
      if (fieldErrors.notes?.[0]) nextErrors.notes = fieldErrors.notes[0]

      setFormErrors(nextErrors)
      show('Verifica datele introduse in formular.', 'warning')
      return
    }

    setFormErrors({})
    const parsedValues = validation.data
    const parsedYear = parsedValues.year ? Number(parsedValues.year) : null
    const parsedWorkingWidth = parsedValues.workingWidth ? Number(parsedValues.workingWidth) : null
    const parsedCapacity = parsedValues.capacity ? Number(parsedValues.capacity) : null

    const payload = {
      name: parsedValues.name,
      code: parsedValues.code,
      type: parsedValues.type,
      brand: parsedValues.brand,
      model: parsedValues.model,
      year: parsedYear,
      working_width: parsedWorkingWidth,
      capacity: parsedCapacity,
      status: parsedValues.status,
      notes: parsedValues.notes || null,
    }

    try {
      if (formMode === 'create') {
        await createImplement.mutateAsync(payload)
        show('Implementul a fost creat.', 'success')
      } else if (formMode === 'edit' && selectedImplement) {
        await updateImplement.mutateAsync({ id: String(selectedImplement.id), payload })
        show('Implementul a fost actualizat.', 'success')
      }
      setFormOpen(false)
    } catch (error) {
      show(getApiErrorMessage(error, 'Nu am putut salva implementul.'), 'error')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!implementToDelete) return

    try {
      await deleteImplement.mutateAsync(String(implementToDelete.id))
      show('Implementul a fost sters.', 'success')
      closeDeleteDialog()
    } catch (error) {
      show(getApiErrorMessage(error, 'Nu am putut sterge implementul.'), 'error')
    }
  }

  const handleToggleConfirm = async () => {
    if (!implementToToggle) return

    const isActive = implementToToggle.status === 'active'

    try {
      if (isActive) {
        await deactivateImplement.mutateAsync(String(implementToToggle.id))
        show('Implementul a fost dezactivat.', 'success')
      } else {
        await activateImplement.mutateAsync(String(implementToToggle.id))
        show('Implementul a fost activat.', 'success')
      }
      closeToggleDialog()
    } catch (error) {
      show(getApiErrorMessage(error, 'Nu am putut actualiza statusul implementului.'), 'error')
    }
  }

  const toggleDescription = implementToToggle
    ? implementToToggle.status === 'active'
      ? `Confirmi dezactivarea implementului „${implementToToggle.name}” (${implementToToggle.code})?`
      : `Confirmi activarea implementului „${implementToToggle.name}” (${implementToToggle.code})?`
    : ''

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <ImplementsPageHeader onCreate={openCreateDialog} canWrite={canWrite} />

      <Box sx={{ mb: 2 }}>
        <TextField
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          label="Cauta implement"
          placeholder="dupa cod, nume, tip, brand sau model"
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
        <ImplementsTable
          implementsData={filteredImplements}
          isLoading={isPending}
          canWrite={canWrite}
          canDelete={canDelete}
          onView={openViewDialog}
          onEdit={openEditDialog}
          onDelete={openDeleteDialog}
          onToggleActive={openToggleDialog}
        />
      )}

      <ImplementFormModal
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
        open={toggleOpen}
        title={
          implementToToggle?.status === 'active' ? 'Dezactiveaza implement' : 'Activeaza implement'
        }
        description={toggleDescription}
        confirmText={implementToToggle?.status === 'active' ? 'Dezactiveaza' : 'Activeaza'}
        loading={toggling}
        onClose={closeToggleDialog}
        onConfirm={handleToggleConfirm}
      />

      <ModalConfirmAction
        open={deleteOpen}
        title="Sterge implement"
        description={
          implementToDelete
            ? `Confirmi stergerea implementului „${implementToDelete.name}” (${implementToDelete.code})?`
            : ''
        }
        confirmText="Sterge"
        loading={deleting}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
      />
    </Box>
  )
}

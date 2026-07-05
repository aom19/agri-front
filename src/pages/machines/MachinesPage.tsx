import { useMemo, useState } from 'react'
import { SearchOutlined } from '@mui/icons-material'
import { Box, CircularProgress, InputAdornment, TextField } from '@mui/material'
import { ModalConfirmAction } from '../../components'
import { useHasPermission } from '../../hooks/usePermissions'
import {
  useCreateMachine,
  useDeleteMachine,
  useMachines,
  useUpdateMachine,
} from '../../hooks/useMachines'
import type { Machine } from '../../api/machine.api'
import { useNotificationStore } from '../../store/notification.store'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import {
  fuelTypeValues,
  machineFormSchema,
  machineStatusValues,
  machineTypeValues,
  type MachineFormErrors,
  type MachineFormValues,
} from '../../schemas/machine.schema'
import { MachineFormModal, MachinesPageHeader, MachinesTable } from './components'

type FormMode = 'create' | 'edit' | 'view'

type MachineFormState = MachineFormValues

const initialFormState: MachineFormState = {
  name: '',
  code: '',
  type: 'tractor',
  brand: '',
  model: '',
  year: '',
  registrationNumber: '',
  fuelType: '',
  status: 'active',
  notes: '',
}

function mapMachineToFormState(machine: Machine): MachineFormState {
  const safeType = machineTypeValues.includes(machine.type as (typeof machineTypeValues)[number])
    ? (machine.type as (typeof machineTypeValues)[number])
    : 'other'

  const safeFuelType = fuelTypeValues.includes(machine.fuel_type as (typeof fuelTypeValues)[number])
    ? (machine.fuel_type as (typeof fuelTypeValues)[number])
    : ''

  const safeStatus = machineStatusValues.includes(
    machine.status as (typeof machineStatusValues)[number]
  )
    ? (machine.status as (typeof machineStatusValues)[number])
    : 'active'

  return {
    name: machine.name,
    code: machine.code,
    type: safeType,
    brand: machine.brand ?? '',
    model: machine.model ?? '',
    year: machine.year == null ? '' : String(machine.year),
    registrationNumber: machine.registration_number ?? '',
    fuelType: safeFuelType,
    status: safeStatus,
    notes: machine.notes ?? '',
  }
}

export default function MachinesPage() {
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null)
  const [formState, setFormState] = useState<MachineFormState>(initialFormState)
  const [formErrors, setFormErrors] = useState<MachineFormErrors>({})
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [machineToDelete, setMachineToDelete] = useState<Machine | null>(null)

  const show = useNotificationStore((state) => state.show)
  const canWrite = useHasPermission('machines:write')
  const canDelete = useHasPermission('machines:delete')

  const { data: machines, isPending } = useMachines()
  const createMachine = useCreateMachine()
  const updateMachine = useUpdateMachine()
  const deleteMachine = useDeleteMachine()

  const submitting = createMachine.isPending || updateMachine.isPending
  const deleting = deleteMachine.isPending

  const filteredMachines = useMemo(() => {
    const value = search.trim().toLowerCase()
    return [...(machines ?? [])]
      .filter((machine) => {
        if (!value) return true
        return (
          machine.name.toLowerCase().includes(value) ||
          machine.code.toLowerCase().includes(value) ||
          machine.type.toLowerCase().includes(value) ||
          machine.brand?.toLowerCase().includes(value) ||
          machine.model?.toLowerCase().includes(value) ||
          machine.registration_number?.toLowerCase().includes(value)
        )
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'ro'))
  }, [machines, search])

  const openCreateDialog = () => {
    setSelectedMachine(null)
    setFormMode('create')
    setFormState(initialFormState)
    setFormErrors({})
    setFormOpen(true)
  }

  const openEditDialog = (machine: Machine) => {
    setSelectedMachine(machine)
    setFormMode('edit')
    setFormState(mapMachineToFormState(machine))
    setFormErrors({})
    setFormOpen(true)
  }

  const openViewDialog = (machine: Machine) => {
    setSelectedMachine(machine)
    setFormMode('view')
    setFormState(mapMachineToFormState(machine))
    setFormErrors({})
    setFormOpen(true)
  }

  const closeFormDialog = () => {
    if (submitting) return
    setFormOpen(false)
    setFormErrors({})
  }

  const openDeleteDialog = (machine: Machine) => {
    setMachineToDelete(machine)
    setDeleteOpen(true)
  }

  const closeDeleteDialog = () => {
    if (deleting) return
    setDeleteOpen(false)
    setMachineToDelete(null)
  }

  const handleSubmit = async () => {
    const validation = machineFormSchema.safeParse(formState)
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors
      const nextErrors: MachineFormErrors = {}

      if (fieldErrors.name?.[0]) nextErrors.name = fieldErrors.name[0]
      if (fieldErrors.code?.[0]) nextErrors.code = fieldErrors.code[0]
      if (fieldErrors.type?.[0]) nextErrors.type = fieldErrors.type[0]
      if (fieldErrors.brand?.[0]) nextErrors.brand = fieldErrors.brand[0]
      if (fieldErrors.model?.[0]) nextErrors.model = fieldErrors.model[0]
      if (fieldErrors.year?.[0]) nextErrors.year = fieldErrors.year[0]
      if (fieldErrors.registrationNumber?.[0]) {
        nextErrors.registrationNumber = fieldErrors.registrationNumber[0]
      }
      if (fieldErrors.fuelType?.[0]) nextErrors.fuelType = fieldErrors.fuelType[0]
      if (fieldErrors.status?.[0]) nextErrors.status = fieldErrors.status[0]
      if (fieldErrors.notes?.[0]) nextErrors.notes = fieldErrors.notes[0]

      setFormErrors(nextErrors)
      show('Verifică datele introduse în formular.', 'warning')
      return
    }

    setFormErrors({})
    const parsedValues = validation.data
    const parsedYear = parsedValues.year ? Number(parsedValues.year) : null

    const payload = {
      name: parsedValues.name,
      code: parsedValues.code,
      type: parsedValues.type,
      brand: parsedValues.brand,
      model: parsedValues.model,
      year: parsedYear,
      registration_number: parsedValues.registrationNumber || null,
      fuel_type: parsedValues.fuelType || null,
      status: parsedValues.status,
      notes: parsedValues.notes || null,
    }

    try {
      if (formMode === 'create') {
        await createMachine.mutateAsync(payload)
        show('Mașina a fost creată.', 'success')
      } else if (formMode === 'edit' && selectedMachine) {
        await updateMachine.mutateAsync({ id: String(selectedMachine.id), payload })
        show('Mașina a fost actualizată.', 'success')
      }
      setFormOpen(false)
    } catch (error) {
      show(getApiErrorMessage(error, 'Nu am putut salva mașina.'), 'error')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!machineToDelete) return

    try {
      await deleteMachine.mutateAsync(String(machineToDelete.id))
      show('Mașina a fost ștearsă.', 'success')
      closeDeleteDialog()
    } catch (error) {
      show(getApiErrorMessage(error, 'Nu am putut șterge mașina.'), 'error')
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <MachinesPageHeader onCreate={openCreateDialog} canWrite={canWrite} />

      <Box sx={{ mb: 2 }}>
        <TextField
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          label="Caută mașină"
          placeholder="după cod, nume, tip, brand sau model"
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
        <MachinesTable
          machines={filteredMachines}
          isLoading={isPending}
          canWrite={canWrite}
          canDelete={canDelete}
          onView={openViewDialog}
          onEdit={openEditDialog}
          onDelete={openDeleteDialog}
        />
      )}

      <MachineFormModal
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
        title="Șterge mașină"
        description={
          machineToDelete
            ? `Confirmi ștergerea mașinii „${machineToDelete.name}” (${machineToDelete.code})?`
            : ''
        }
        confirmText="Șterge"
        loading={deleting}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
      />
    </Box>
  )
}

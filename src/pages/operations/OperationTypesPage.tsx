import { useMemo, useState } from 'react'
import {
  AddOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  VisibilityOutlined,
} from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import type { OperationType } from '../../api/operation.api'
import { ModalConfirmAction } from '../../components'
import { useHasPermission } from '../../hooks/usePermissions'
import {
  useCreateOperationType,
  useDeleteOperationType,
  useOperationTypes,
  useUpdateOperationType,
} from '../../hooks/useOperations'
import {
  operationTypeFormSchema,
  type OperationTypeFormErrors,
  type OperationTypeFormValues,
} from '../../schemas/operation.schema'
import { useNotificationStore } from '../../store/notification.store'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'

type FormMode = 'create' | 'edit' | 'view'

const initialFormState: OperationTypeFormValues = {
  code: '',
  name: '',
  description: '',
}

export default function OperationTypesPage() {
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [selected, setSelected] = useState<OperationType | null>(null)
  const [formState, setFormState] = useState<OperationTypeFormValues>(initialFormState)
  const [formErrors, setFormErrors] = useState<OperationTypeFormErrors>({})
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [toDelete, setToDelete] = useState<OperationType | null>(null)

  const show = useNotificationStore((s) => s.show)
  const canWrite = useHasPermission('operations:write')
  const canDelete = useHasPermission('operations:delete')

  const { data, isPending } = useOperationTypes()
  const createMutation = useCreateOperationType()
  const updateMutation = useUpdateOperationType()
  const deleteMutation = useDeleteOperationType()

  const submitting = createMutation.isPending || updateMutation.isPending

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return [...(data ?? [])]
      .filter((item) => {
        if (!q) return true
        return (
          item.code.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'ro'))
  }, [data, search])

  const openCreate = () => {
    setSelected(null)
    setFormMode('create')
    setFormState(initialFormState)
    setFormErrors({})
    setFormOpen(true)
  }

  const openEdit = (item: OperationType) => {
    setSelected(item)
    setFormMode('edit')
    setFormState({ code: item.code, name: item.name, description: item.description })
    setFormErrors({})
    setFormOpen(true)
  }

  const openView = (item: OperationType) => {
    setSelected(item)
    setFormMode('view')
    setFormState({ code: item.code, name: item.name, description: item.description })
    setFormErrors({})
    setFormOpen(true)
  }

  const closeForm = () => {
    if (submitting) return
    setFormOpen(false)
    setFormErrors({})
  }

  const openDelete = (item: OperationType) => {
    setToDelete(item)
    setDeleteOpen(true)
  }

  const closeDelete = () => {
    if (deleteMutation.isPending) return
    setDeleteOpen(false)
    setToDelete(null)
  }

  const handleSubmit = async () => {
    const validation = operationTypeFormSchema.safeParse(formState)
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors
      const nextErrors: OperationTypeFormErrors = {}
      if (fieldErrors.code?.[0]) nextErrors.code = fieldErrors.code[0]
      if (fieldErrors.name?.[0]) nextErrors.name = fieldErrors.name[0]
      if (fieldErrors.description?.[0]) nextErrors.description = fieldErrors.description[0]
      setFormErrors(nextErrors)
      show('Verifică datele introduse.', 'warning')
      return
    }

    setFormErrors({})
    const payload = {
      code: validation.data.code,
      name: validation.data.name,
      description: validation.data.description,
    }

    try {
      if (formMode === 'create') {
        await createMutation.mutateAsync(payload)
        show('Tipul de operațiune a fost creat.', 'success')
      } else if (formMode === 'edit' && selected) {
        await updateMutation.mutateAsync({ id: selected.id, payload })
        show('Tipul de operațiune a fost actualizat.', 'success')
      }
      setFormOpen(false)
    } catch (error) {
      show(getApiErrorMessage(error, 'Nu am putut salva tipul de operațiune.'), 'error')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!toDelete) return
    try {
      await deleteMutation.mutateAsync(toDelete.id)
      show('Tipul de operațiune a fost șters.', 'success')
      closeDelete()
    } catch (error) {
      show(getApiErrorMessage(error, 'Nu am putut șterge tipul de operațiune.'), 'error')
    }
  }

  const isView = formMode === 'view'

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 2, gap: 1.5 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Tipuri de operațiuni
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Definirea categoriilor de operațiuni agricole.
          </Typography>
        </Box>

        {canWrite && (
          <Button variant="contained" startIcon={<AddOutlined />} onClick={openCreate}>
            Tip nou
          </Button>
        )}
      </Stack>

      <Box sx={{ mb: 2 }}>
        <TextField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          label="Caută tip operațiune"
          placeholder="după cod sau nume"
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
        <Card>
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>Cod</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>Nume</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>Descriere</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontWeight: 700 }}>Acțiuni</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {item.code}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.description || '—'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Vezi detalii">
                        <IconButton size="small" onClick={() => openView(item)}>
                          <VisibilityOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canWrite && (
                        <Tooltip title="Editează">
                          <IconButton size="small" onClick={() => openEdit(item)}>
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title="Șterge">
                          <IconButton size="small" color="error" onClick={() => openDelete(item)}>
                            <DeleteOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                        Nu există tipuri de operațiuni.
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onClose={closeForm} fullWidth maxWidth="sm">
        <DialogTitle>
          {formMode === 'create'
            ? 'Creează tip operațiune'
            : formMode === 'edit'
              ? 'Editează tip operațiune'
              : 'Detalii tip operațiune'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              label="Cod"
              required
              value={formState.code}
              onChange={(e) => setFormState((p) => ({ ...p, code: e.target.value }))}
              disabled={submitting || isView}
              error={Boolean(formErrors.code)}
              helperText={formErrors.code || 'Ex: plow, seed, spray'}
              fullWidth
            />
            <TextField
              label="Nume"
              required
              value={formState.name}
              onChange={(e) => setFormState((p) => ({ ...p, name: e.target.value }))}
              disabled={submitting || isView}
              error={Boolean(formErrors.name)}
              helperText={formErrors.name}
              fullWidth
            />
            <TextField
              label="Descriere"
              value={formState.description}
              onChange={(e) => setFormState((p) => ({ ...p, description: e.target.value }))}
              disabled={submitting || isView}
              error={Boolean(formErrors.description)}
              helperText={formErrors.description}
              fullWidth
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeForm} disabled={submitting}>
            {isView ? 'Închide' : 'Anulează'}
          </Button>
          {!isView && (
            <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <CircularProgress size={20} />
              ) : formMode === 'create' ? (
                'Creează'
              ) : (
                'Salvează'
              )}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <ModalConfirmAction
        open={deleteOpen}
        title="Șterge tip operațiune"
        description={`Sigur vrei să ștergi tipul „${toDelete?.name}"?`}
        confirmText="Șterge"
        onConfirm={handleDeleteConfirm}
        onClose={closeDelete}
        loading={deleteMutation.isPending}
      />
    </Box>
  )
}

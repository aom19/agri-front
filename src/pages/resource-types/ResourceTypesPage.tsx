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
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
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
import type { ResourceType } from '../../api/resource.api'
import { ModalConfirmAction } from '../../components'
import { useHasPermission } from '../../hooks/usePermissions'
import {
  useCreateResourceType,
  useDeleteResourceType,
  useResourceTypes,
  useUpdateResourceType,
} from '../../hooks/useResources'
import {
  resourceCategoryOptions,
  resourceTypeFormSchema,
  type ResourceTypeFormErrors,
  type ResourceTypeFormValues,
} from '../../schemas/resourceType.schema'
import { useNotificationStore } from '../../store/notification.store'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'

type FormMode = 'create' | 'edit' | 'view'

const categoryLabelByValue = new Map(
  resourceCategoryOptions.map((option) => [option.value, option.label]),
)

const initialFormState: ResourceTypeFormValues = {
  name: '',
  category: 'fuel',
  defaultUnit: '',
}

function mapResourceTypeToFormState(resourceType: ResourceType): ResourceTypeFormValues {
  return {
    name: resourceType.name,
    category: resourceType.category,
    defaultUnit: resourceType.default_unit,
  }
}

export default function ResourceTypesPage() {
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [selectedResourceType, setSelectedResourceType] = useState<ResourceType | null>(null)
  const [formState, setFormState] = useState<ResourceTypeFormValues>(initialFormState)
  const [formErrors, setFormErrors] = useState<ResourceTypeFormErrors>({})
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [resourceTypeToDelete, setResourceTypeToDelete] = useState<ResourceType | null>(null)

  const show = useNotificationStore((state) => state.show)
  const canWrite = useHasPermission('resources:write')
  const canDelete = useHasPermission('resources:delete')

  const { data: resourceTypesData, isPending } = useResourceTypes()
  const createResourceType = useCreateResourceType()
  const updateResourceType = useUpdateResourceType()
  const deleteResourceType = useDeleteResourceType()

  const submitting = createResourceType.isPending || updateResourceType.isPending
  const deleting = deleteResourceType.isPending

  const filteredResourceTypes = useMemo(() => {
    const value = search.trim().toLowerCase()
    return [...(resourceTypesData ?? [])]
      .filter((resourceType) => {
        if (!value) return true
        const categoryLabel = categoryLabelByValue.get(resourceType.category) ?? resourceType.category
        return (
          resourceType.name.toLowerCase().includes(value) ||
          resourceType.category.toLowerCase().includes(value) ||
          categoryLabel.toLowerCase().includes(value) ||
          resourceType.default_unit.toLowerCase().includes(value)
        )
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'ro'))
  }, [resourceTypesData, search])

  const openCreateDialog = () => {
    setSelectedResourceType(null)
    setFormMode('create')
    setFormState(initialFormState)
    setFormErrors({})
    setFormOpen(true)
  }

  const openEditDialog = (resourceType: ResourceType) => {
    setSelectedResourceType(resourceType)
    setFormMode('edit')
    setFormState(mapResourceTypeToFormState(resourceType))
    setFormErrors({})
    setFormOpen(true)
  }

  const openViewDialog = (resourceType: ResourceType) => {
    setSelectedResourceType(resourceType)
    setFormMode('view')
    setFormState(mapResourceTypeToFormState(resourceType))
    setFormErrors({})
    setFormOpen(true)
  }

  const closeFormDialog = () => {
    if (submitting) return
    setFormOpen(false)
    setFormErrors({})
  }

  const openDeleteDialog = (resourceType: ResourceType) => {
    setResourceTypeToDelete(resourceType)
    setDeleteOpen(true)
  }

  const closeDeleteDialog = () => {
    if (deleting) return
    setDeleteOpen(false)
    setResourceTypeToDelete(null)
  }

  const handleSubmit = async () => {
    const validation = resourceTypeFormSchema.safeParse(formState)
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors
      const nextErrors: ResourceTypeFormErrors = {}

      if (fieldErrors.name?.[0]) nextErrors.name = fieldErrors.name[0]
      if (fieldErrors.category?.[0]) nextErrors.category = fieldErrors.category[0]
      if (fieldErrors.defaultUnit?.[0]) nextErrors.defaultUnit = fieldErrors.defaultUnit[0]

      setFormErrors(nextErrors)
      show('Verifică datele introduse în formular.', 'warning')
      return
    }

    setFormErrors({})
    const payload = {
      name: validation.data.name,
      category: validation.data.category,
      default_unit: validation.data.defaultUnit,
    }

    try {
      if (formMode === 'create') {
        await createResourceType.mutateAsync(payload)
        show('Categoria de resurse a fost creată.', 'success')
      } else if (formMode === 'edit' && selectedResourceType) {
        await updateResourceType.mutateAsync({ id: String(selectedResourceType.id), payload })
        show('Categoria de resurse a fost actualizată.', 'success')
      }
      setFormOpen(false)
    } catch (error) {
      show(getApiErrorMessage(error, 'Nu am putut salva categoria de resurse.'), 'error')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!resourceTypeToDelete) return

    try {
      await deleteResourceType.mutateAsync(String(resourceTypeToDelete.id))
      show('Categoria de resurse a fost ștearsă.', 'success')
      closeDeleteDialog()
    } catch (error) {
      show(
        getApiErrorMessage(
          error,
          'Nu am putut șterge categoria. Verifică dacă are resurse asociate.',
        ),
        'error',
      )
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
            Categorii de resurse
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administrare tipuri, categorii și unități implicite pentru resurse.
          </Typography>
        </Box>

        {canWrite && (
          <Button variant="contained" startIcon={<AddOutlined />} onClick={openCreateDialog}>
            Categorie nouă
          </Button>
        )}
      </Stack>

      <Box sx={{ mb: 2 }}>
        <TextField
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          label="Caută categorie"
          placeholder="după nume, categorie sau unitate"
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
                    <Typography sx={{ fontWeight: 700 }}>Nume</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>Categorie</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>Unitate implicită</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontWeight: 700 }}>Acțiuni</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredResourceTypes.map((resourceType) => (
                  <TableRow key={resourceType.id} hover>
                    <TableCell>{resourceType.name}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={
                          categoryLabelByValue.get(resourceType.category) ?? resourceType.category
                        }
                      />
                    </TableCell>
                    <TableCell>{resourceType.default_unit}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Vezi detalii">
                        <IconButton
                          size="small"
                          onClick={() => openViewDialog(resourceType)}
                          aria-label="Vezi detalii"
                        >
                          <VisibilityOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canWrite && (
                        <Tooltip title="Editează categoria">
                          <IconButton
                            size="small"
                            onClick={() => openEditDialog(resourceType)}
                            aria-label="Editează categoria"
                          >
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title="Șterge categoria">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => openDeleteDialog(resourceType)}
                            aria-label="Șterge categoria"
                          >
                            <DeleteOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredResourceTypes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                        Nu există categorii pentru filtrul curent.
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={formOpen} onClose={closeFormDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {formMode === 'create'
            ? 'Creează categorie de resurse'
            : formMode === 'edit'
              ? 'Editează categorie de resurse'
              : 'Detalii categorie de resurse'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              label="Nume"
              required
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              disabled={submitting || isView}
              error={Boolean(formErrors.name)}
              helperText={formErrors.name}
              fullWidth
            />
            <FormControl fullWidth required error={Boolean(formErrors.category)}>
              <InputLabel id="resource-category-label">Categorie</InputLabel>
              <Select
                labelId="resource-category-label"
                label="Categorie"
                value={formState.category}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    category: event.target.value as ResourceTypeFormValues['category'],
                  }))
                }
                disabled={submitting || isView}
              >
                {resourceCategoryOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.category && <FormHelperText>{formErrors.category}</FormHelperText>}
            </FormControl>
            <TextField
              label="Unitate implicită"
              required
              value={formState.defaultUnit}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, defaultUnit: event.target.value }))
              }
              disabled={submitting || isView}
              error={Boolean(formErrors.defaultUnit)}
              helperText={formErrors.defaultUnit}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeFormDialog} color="inherit" disabled={submitting}>
            {isView ? 'Închide' : 'Anulează'}
          </Button>
          {!isView && (
            <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
              {formMode === 'create' ? 'Creează' : 'Salvează'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <ModalConfirmAction
        open={deleteOpen}
        title="Șterge categorie de resurse"
        description={
          resourceTypeToDelete
            ? `Confirmi ștergerea categoriei „${resourceTypeToDelete.name}”? Resursele asociate trebuie șterse sau mutate înainte.`
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

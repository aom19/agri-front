import { useMemo, useState } from 'react'
import {
  AddOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  SwapVertOutlined,
  VisibilityOutlined,
} from '@mui/icons-material'
import {
  Alert,
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
import type { Resource } from '../../api/resource.api'
import { ModalConfirmAction } from '../../components'
import { useHasPermission } from '../../hooks/usePermissions'
import {
  useCreateResource,
  useDeleteResource,
  useResources,
  useResourceTypes,
  useUpdateResource,
} from '../../hooks/useResources'
import {
  resourceFormSchema,
  type ResourceFormErrors,
  type ResourceFormValues,
} from '../../schemas/resource.schema'
import { useNotificationStore } from '../../store/notification.store'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import StockMovementsDialog from './components/StockMovementsDialog'

type FormMode = 'create' | 'edit' | 'view'

const categoryLabel: Record<string, string> = {
  fuel: 'Combustibil',
  fertilizer: 'Îngrășământ',
  seed: 'Sămânță',
  pesticide: 'Pesticid',
  water: 'Apă',
  harvest: 'Recoltă',
  other: 'Altele',
}

const initialFormState: ResourceFormValues = {
  name: '',
  resourceTypeId: '',
  pricePerUnit: '',
  quantity: '0',
  minimumQuantity: '0',
  notes: '',
}

function mapResourceToFormState(resource: Resource): ResourceFormValues {
  return {
    name: resource.name,
    resourceTypeId: String(resource.resource_type_id),
    pricePerUnit: String(resource.price_per_unit),
    quantity: String(resource.quantity),
    minimumQuantity: String(resource.minimum_quantity),
    notes: resource.notes ?? '',
  }
}

function formatQuantity(value: number): string {
  return new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 4 }).format(value)
}

// Ca în dashboard și rapoarte: un prag minim 0 înseamnă că stocul nu e urmărit.
function isLowStock(resource: Resource): boolean {
  return resource.minimum_quantity > 0 && resource.quantity <= resource.minimum_quantity
}

export default function ResourcesPage() {
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [formState, setFormState] = useState<ResourceFormValues>(initialFormState)
  const [formErrors, setFormErrors] = useState<ResourceFormErrors>({})
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null)
  const [movementsResourceId, setMovementsResourceId] = useState<number | null>(null)

  const show = useNotificationStore((state) => state.show)
  const canWrite = useHasPermission('resources:write')
  const canDelete = useHasPermission('resources:delete')

  const { data: resourcesData, isPending: resourcesLoading } = useResources()
  const { data: resourceTypesData, isPending: resourceTypesLoading } = useResourceTypes()

  const createResource = useCreateResource()
  const updateResource = useUpdateResource()
  const deleteResource = useDeleteResource()

  const submitting = createResource.isPending || updateResource.isPending
  const deleting = deleteResource.isPending

  const isPending = resourcesLoading || resourceTypesLoading

  const resourceTypeById = useMemo(() => {
    const map = new Map<number, { name: string; category: string; defaultUnit: string }>()
    for (const item of resourceTypesData ?? []) {
      map.set(item.id, {
        name: item.name,
        category: item.category,
        defaultUnit: item.default_unit,
      })
    }
    return map
  }, [resourceTypesData])

  const filteredResources = useMemo(() => {
    const value = search.trim().toLowerCase()
    return [...(resourcesData ?? [])]
      .filter((resource) => {
        if (!value) return true
        const resourceType = resourceTypeById.get(resource.resource_type_id)
        return (
          resource.name.toLowerCase().includes(value) ||
          resourceType?.defaultUnit.toLowerCase().includes(value) ||
          resourceType?.name.toLowerCase().includes(value) ||
          resourceType?.category.toLowerCase().includes(value)
        )
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'ro'))
  }, [resourcesData, search, resourceTypeById])

  // Resursa din listă, nu o copie: stocul din dialog se actualizează după fiecare mișcare.
  const movementsResource =
    (resourcesData ?? []).find((resource) => resource.id === movementsResourceId) ?? null

  const openCreateDialog = () => {
    setSelectedResource(null)
    setFormMode('create')
    setFormState(initialFormState)
    setFormErrors({})
    setFormOpen(true)
  }

  const openEditDialog = (resource: Resource) => {
    setSelectedResource(resource)
    setFormMode('edit')
    setFormState(mapResourceToFormState(resource))
    setFormErrors({})
    setFormOpen(true)
  }

  const openViewDialog = (resource: Resource) => {
    setSelectedResource(resource)
    setFormMode('view')
    setFormState(mapResourceToFormState(resource))
    setFormErrors({})
    setFormOpen(true)
  }

  const closeFormDialog = () => {
    if (submitting) return
    setFormOpen(false)
    setFormErrors({})
  }

  const openMovementsFromForm = () => {
    if (!selectedResource) return
    setFormOpen(false)
    setMovementsResourceId(selectedResource.id)
  }

  const openDeleteDialog = (resource: Resource) => {
    setResourceToDelete(resource)
    setDeleteOpen(true)
  }

  const closeDeleteDialog = () => {
    if (deleting) return
    setDeleteOpen(false)
    setResourceToDelete(null)
  }

  const handleSubmit = async () => {
    const validation = resourceFormSchema.safeParse(formState)
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors
      const nextErrors: ResourceFormErrors = {}

      if (fieldErrors.name?.[0]) nextErrors.name = fieldErrors.name[0]
      if (fieldErrors.resourceTypeId?.[0]) nextErrors.resourceTypeId = fieldErrors.resourceTypeId[0]
      if (fieldErrors.pricePerUnit?.[0]) nextErrors.pricePerUnit = fieldErrors.pricePerUnit[0]
      if (fieldErrors.quantity?.[0]) nextErrors.quantity = fieldErrors.quantity[0]
      if (fieldErrors.minimumQuantity?.[0])
        nextErrors.minimumQuantity = fieldErrors.minimumQuantity[0]
      if (fieldErrors.notes?.[0]) nextErrors.notes = fieldErrors.notes[0]

      setFormErrors(nextErrors)
      show('Verifică datele introduse în formular.', 'warning')
      return
    }

    setFormErrors({})
    const parsedValues = validation.data
    const payload = {
      name: parsedValues.name,
      resource_type_id: Number(parsedValues.resourceTypeId),
      price_per_unit: Number(parsedValues.pricePerUnit),
      minimum_quantity: Number(parsedValues.minimumQuantity),
      notes: parsedValues.notes || null,
    }

    try {
      if (formMode === 'create') {
        await createResource.mutateAsync({ ...payload, quantity: Number(parsedValues.quantity) })
        show('Resursa a fost creată.', 'success')
      } else if (formMode === 'edit' && selectedResource) {
        // Cantitatea nu se editează: corecțiile se fac prin mișcări de stoc.
        await updateResource.mutateAsync({ id: String(selectedResource.id), payload })
        show('Resursa a fost actualizată.', 'success')
      }
      setFormOpen(false)
    } catch (error) {
      show(getApiErrorMessage(error, 'Nu am putut salva resursa.'), 'error')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!resourceToDelete) return

    try {
      await deleteResource.mutateAsync(String(resourceToDelete.id))
      show('Resursa a fost ștearsă.', 'success')
      closeDeleteDialog()
    } catch (error) {
      show(getApiErrorMessage(error, 'Nu am putut șterge resursa.'), 'error')
    }
  }

  const isView = formMode === 'view'
  const isCreate = formMode === 'create'
  const formUnit = resourceTypeById.get(Number(formState.resourceTypeId))?.defaultUnit ?? ''
  const unitAdornment = formUnit
    ? { input: { endAdornment: <InputAdornment position="end">{formUnit}</InputAdornment> } }
    : undefined

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 2, gap: 1.5 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Resurse și stocuri
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Consumabile agricole, cantități disponibile și praguri minime.
          </Typography>
        </Box>

        {canWrite && (
          <Button variant="contained" startIcon={<AddOutlined />} onClick={openCreateDialog}>
            Resursă nouă
          </Button>
        )}
      </Stack>

      <Box sx={{ mb: 2 }}>
        <TextField
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          label="Caută resursă"
          placeholder="după nume, tip, categorie sau unitate"
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
                    <Typography sx={{ fontWeight: 700 }}>Tip</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>Cantitate</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>Minim</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>Status</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>Preț / unitate</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontWeight: 700 }}>Acțiuni</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredResources.map((resource) => {
                  const resourceType = resourceTypeById.get(resource.resource_type_id)
                  const unit = resourceType?.defaultUnit ?? ''
                  const low = isLowStock(resource)
                  return (
                    <TableRow key={resource.id} hover>
                      <TableCell>{resource.name}</TableCell>
                      <TableCell>{resourceType?.name ?? '-'}</TableCell>
                      <TableCell>
                        {formatQuantity(resource.quantity)} {unit}
                      </TableCell>
                      <TableCell>
                        {formatQuantity(resource.minimum_quantity)} {unit}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={low ? 'warning' : 'success'}
                          label={low ? 'Stoc redus' : 'În limite'}
                        />
                      </TableCell>
                      <TableCell>{resource.price_per_unit.toFixed(2)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Mișcări de stoc">
                          <IconButton
                            size="small"
                            onClick={() => setMovementsResourceId(resource.id)}
                            aria-label="Mișcări de stoc"
                          >
                            <SwapVertOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Vezi detalii">
                          <IconButton
                            size="small"
                            onClick={() => openViewDialog(resource)}
                            aria-label="Vezi detalii"
                          >
                            <VisibilityOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {canWrite && (
                          <Tooltip title="Editează resursa">
                            <IconButton
                              size="small"
                              onClick={() => openEditDialog(resource)}
                              aria-label="Editează resursa"
                            >
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {canDelete && (
                          <Tooltip title="Șterge resursa">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => openDeleteDialog(resource)}
                              aria-label="Șterge resursa"
                            >
                              <DeleteOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}

                {filteredResources.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                        Nu există resurse pentru filtrul curent.
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={formOpen} onClose={closeFormDialog} fullWidth maxWidth="md">
        <DialogTitle>
          {formMode === 'create'
            ? 'Creează resursă'
            : formMode === 'edit'
              ? 'Editează resursă'
              : 'Detalii resursă'}
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

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <FormControl fullWidth error={Boolean(formErrors.resourceTypeId)}>
                <InputLabel id="resource-type-label">Tip resursă</InputLabel>
                <Select
                  labelId="resource-type-label"
                  label="Tip resursă"
                  value={formState.resourceTypeId}
                  onChange={(event) => {
                    const selectedId = event.target.value
                    setFormState((prev) => ({
                      ...prev,
                      resourceTypeId: selectedId,
                    }))
                  }}
                  disabled={submitting || isView}
                >
                  {(resourceTypesData ?? []).map((typeItem) => (
                    <MenuItem key={typeItem.id} value={String(typeItem.id)}>
                      {typeItem.name} ({categoryLabel[typeItem.category] ?? typeItem.category})
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.resourceTypeId && (
                  <FormHelperText>{formErrors.resourceTypeId}</FormHelperText>
                )}
              </FormControl>

              <TextField
                label="Preț per unitate"
                required
                value={formState.pricePerUnit}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, pricePerUnit: event.target.value }))
                }
                disabled={submitting || isView}
                error={Boolean(formErrors.pricePerUnit)}
                helperText={formErrors.pricePerUnit}
                fullWidth
              />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label={isCreate ? 'Cantitate inițială' : 'Cantitate'}
                required={isCreate}
                value={formState.quantity}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, quantity: event.target.value }))
                }
                disabled={submitting || !isCreate}
                error={Boolean(formErrors.quantity)}
                helperText={
                  formErrors.quantity ??
                  (isCreate
                    ? 'Se înregistrează ca ajustare de inventar.'
                    : 'Se modifică doar prin mișcări de stoc.')
                }
                slotProps={unitAdornment}
                fullWidth
              />
              <TextField
                label="Cantitate minimă"
                required
                value={formState.minimumQuantity}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, minimumQuantity: event.target.value }))
                }
                disabled={submitting || isView}
                error={Boolean(formErrors.minimumQuantity)}
                helperText={formErrors.minimumQuantity ?? 'Sub acest prag, stocul apare ca redus.'}
                slotProps={unitAdornment}
                fullWidth
              />
            </Stack>

            {formMode === 'edit' && selectedResource && (
              <Alert
                severity="info"
                action={
                  <Button color="inherit" size="small" onClick={openMovementsFromForm}>
                    Mișcări
                  </Button>
                }
              >
                Pentru a corecta cantitatea, înregistrează o ajustare de inventar.
              </Alert>
            )}

            <TextField
              label="Notițe"
              value={formState.notes}
              onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
              disabled={submitting || isView}
              error={Boolean(formErrors.notes)}
              helperText={formErrors.notes}
              fullWidth
              multiline
              minRows={3}
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

      <StockMovementsDialog
        open={Boolean(movementsResource)}
        resource={movementsResource}
        unit={
          movementsResource
            ? (resourceTypeById.get(movementsResource.resource_type_id)?.defaultUnit ?? '')
            : ''
        }
        canUpdate={canWrite}
        onClose={() => setMovementsResourceId(null)}
      />

      <ModalConfirmAction
        open={deleteOpen}
        title="Șterge resursă"
        description={
          resourceToDelete ? `Confirmi ștergerea resursei „${resourceToDelete.name}”?` : ''
        }
        confirmText="Șterge"
        loading={deleting}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
      />
    </Box>
  )
}

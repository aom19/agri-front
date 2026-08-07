import { useMemo, useState } from 'react'
import {
  AddOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  VisibilityOutlined,
  RemoveCircleOutlined,
} from '@mui/icons-material'
import {
  Autocomplete,
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
  Divider,
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
import { operationApi } from '../../api/operation.api'
import type { OperationTemplate, TemplateResourcePayload } from '../../api/operation.api'
import { ModalConfirmAction } from '../../components'
import { useHasPermission } from '../../hooks/usePermissions'
import {
  useCreateOperationTemplate,
  useDeleteOperationTemplate,
  useImplementCompatibilities,
  useOperationTemplates,
  useOperationTypes,
  useUpdateOperationTemplate,
} from '../../hooks/useOperations'
import { useResources } from '../../hooks/useResources'
import {
  operationTemplateFormSchema,
  type OperationTemplateFormErrors,
  type OperationTemplateFormValues,
} from '../../schemas/operation.schema'
import { useNotificationStore } from '../../store/notification.store'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'

type FormMode = 'create' | 'edit' | 'view'

const machineTypeOptions = [
  { value: 'tractor', label: 'Tractor' },
  { value: 'combine', label: 'Combină' },
  { value: 'drone', label: 'Dronă' },
  { value: 'sprayer', label: 'Stropitoare' },
  { value: 'car', label: 'Mașină' },
  { value: 'small_truck', label: 'Camionetă' },
  { value: 'other', label: 'Altele' },
]

const implementTypeOptions = [
  { value: 'plow', label: 'Plug' },
  { value: 'disc_harrow', label: 'Disc' },
  { value: 'cultivator', label: 'Cultivator' },
  { value: 'seeder', label: 'Semănătoare' },
  { value: 'fertilizer_spreader', label: 'Fertilizator' },
  { value: 'sprayer', label: 'Stropitoare' },
  { value: 'trailer', label: 'Remorcă' },
  { value: 'header', label: 'Header' },
  { value: 'other', label: 'Altele' },
]

const initialFormState: OperationTemplateFormValues = {
  name: '',
  operationTypeId: '',
  unit: 'ha',
  description: '',
}

type ResourceRow = {
  resource_id: number
  quantity_per_unit: string
  notes: string
}

export default function OperationTemplatesPage() {
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [selected, setSelected] = useState<OperationTemplate | null>(null)
  const [formState, setFormState] = useState<OperationTemplateFormValues>(initialFormState)
  const [formErrors, setFormErrors] = useState<OperationTemplateFormErrors>({})
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [toDelete, setToDelete] = useState<OperationTemplate | null>(null)

  // Related data in the form
  const [resourceRows, setResourceRows] = useState<ResourceRow[]>([])
  const [machineTypes, setMachineTypes] = useState<string[]>([])
  const [implementTypes, setImplementTypes] = useState<string[]>([])

  const show = useNotificationStore((s) => s.show)
  const canWrite = useHasPermission('operations:write')
  const canDelete = useHasPermission('operations:delete')

  const { data: templates, isPending: templatesLoading } = useOperationTemplates()
  const { data: operationTypes, isPending: typesLoading } = useOperationTypes()
  const { data: resources } = useResources()
  const { data: compatibilities } = useImplementCompatibilities()

  const createMutation = useCreateOperationTemplate()
  const updateMutation = useUpdateOperationTemplate()
  const deleteMutation = useDeleteOperationTemplate()

  const submitting = createMutation.isPending || updateMutation.isPending
  const isPending = templatesLoading || typesLoading

  // Implement types compatible with the currently selected machine types.
  const allowedImplementTypes = useMemo(() => {
    if (!compatibilities || machineTypes.length === 0) return null
    const set = new Set<string>()
    for (const c of compatibilities) {
      if (machineTypes.includes(c.machine_type)) set.add(c.implement_type)
    }
    return set
  }, [compatibilities, machineTypes])

  const availableImplementOptions = useMemo(() => {
    if (!allowedImplementTypes) return implementTypeOptions
    return implementTypeOptions.filter((o) => allowedImplementTypes.has(o.value))
  }, [allowedImplementTypes])

  const operationTypeById = useMemo(() => {
    const map = new Map<number, string>()
    for (const ot of operationTypes ?? []) map.set(ot.id, ot.name)
    return map
  }, [operationTypes])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return [...(templates ?? [])]
      .filter((t) => {
        if (!q) return true
        const typeName = operationTypeById.get(t.operation_type_id) ?? ''
        return (
          t.name.toLowerCase().includes(q) ||
          typeName.toLowerCase().includes(q) ||
          t.unit.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'ro'))
  }, [templates, search, operationTypeById])

  const openCreate = () => {
    setSelected(null)
    setFormMode('create')
    setFormState(initialFormState)
    setFormErrors({})
    setResourceRows([])
    setMachineTypes([])
    setImplementTypes([])
    setFormOpen(true)
  }

  const applyTemplateToForm = (item: OperationTemplate, mode: FormMode) => {
    setSelected(item)
    setFormMode(mode)
    setFormState({
      name: item.name,
      operationTypeId: String(item.operation_type_id),
      unit: item.unit,
      description: item.description,
    })
    setResourceRows(
      (item.resources ?? []).map((r) => ({
        resource_id: r.resource_id,
        quantity_per_unit: String(r.quantity_per_unit),
        notes: r.notes,
      }))
    )
    setMachineTypes(item.machine_types ?? [])
    setImplementTypes(item.implement_types ?? [])
    setFormErrors({})
    setFormOpen(true)
  }

  const openEdit = async (item: OperationTemplate) => {
    try {
      const full = await operationApi.getTemplateById(item.id)
      applyTemplateToForm(full, 'edit')
    } catch (error) {
      show(getApiErrorMessage(error, 'Nu am putut încărca template-ul.'), 'error')
    }
  }

  const openView = async (item: OperationTemplate) => {
    try {
      const full = await operationApi.getTemplateById(item.id)
      applyTemplateToForm(full, 'view')
    } catch (error) {
      show(getApiErrorMessage(error, 'Nu am putut încărca template-ul.'), 'error')
    }
  }

  const closeForm = () => {
    if (submitting) return
    setFormOpen(false)
    setFormErrors({})
  }

  const openDeleteDialog = (item: OperationTemplate) => {
    setToDelete(item)
    setDeleteOpen(true)
  }

  const closeDelete = () => {
    if (deleteMutation.isPending) return
    setDeleteOpen(false)
    setToDelete(null)
  }

  const addResourceRow = () => {
    setResourceRows((prev) => [...prev, { resource_id: 0, quantity_per_unit: '', notes: '' }])
  }

  const removeResourceRow = (index: number) => {
    setResourceRows((prev) => prev.filter((_, i) => i !== index))
  }

  const updateResourceRow = (index: number, field: keyof ResourceRow, value: string | number) => {
    setResourceRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    )
  }

  const handleSubmit = async () => {
    const validation = operationTemplateFormSchema.safeParse(formState)
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors
      const nextErrors: OperationTemplateFormErrors = {}
      if (fieldErrors.name?.[0]) nextErrors.name = fieldErrors.name[0]
      if (fieldErrors.operationTypeId?.[0])
        nextErrors.operationTypeId = fieldErrors.operationTypeId[0]
      if (fieldErrors.unit?.[0]) nextErrors.unit = fieldErrors.unit[0]
      if (fieldErrors.description?.[0]) nextErrors.description = fieldErrors.description[0]
      setFormErrors(nextErrors)
      show('Verifică datele introduse.', 'warning')
      return
    }

    setFormErrors({})

    const resPayload: TemplateResourcePayload[] = resourceRows
      .filter((r) => r.resource_id > 0 && r.quantity_per_unit)
      .map((r) => ({
        resource_id: r.resource_id,
        quantity_per_unit: Number(r.quantity_per_unit),
        notes: r.notes,
      }))

    const payload = {
      operation_type_id: Number(validation.data.operationTypeId),
      name: validation.data.name,
      description: validation.data.description,
      unit: validation.data.unit,
      resources: resPayload,
      machine_types: machineTypes,
      implement_types: implementTypes,
    }

    try {
      if (formMode === 'create') {
        await createMutation.mutateAsync(payload)
        show('Template-ul a fost creat.', 'success')
      } else if (formMode === 'edit' && selected) {
        await updateMutation.mutateAsync({ id: selected.id, payload })
        show('Template-ul a fost actualizat.', 'success')
      }
      setFormOpen(false)
    } catch (error) {
      show(getApiErrorMessage(error, 'Nu am putut salva template-ul.'), 'error')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!toDelete) return
    try {
      await deleteMutation.mutateAsync(toDelete.id)
      show('Template-ul a fost șters.', 'success')
      closeDelete()
    } catch (error) {
      show(getApiErrorMessage(error, 'Nu am putut șterge template-ul.'), 'error')
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
            Template-uri operațiuni
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Rețete de operațiuni cu resurse necesare și echipament compatibil.
          </Typography>
        </Box>

        {canWrite && (
          <Button variant="contained" startIcon={<AddOutlined />} onClick={openCreate}>
            Template nou
          </Button>
        )}
      </Stack>

      <Box sx={{ mb: 2 }}>
        <TextField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          label="Caută template"
          placeholder="după nume sau tip operațiune"
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
                    <Typography sx={{ fontWeight: 700 }}>Tip operațiune</Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Unitatea de lucru la care se raportează consumurile de resurse (ex: ha, km, buc).">
                      <Typography sx={{ fontWeight: 700, cursor: 'help' }}>
                        Unitate de lucru
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>Resurse consumate</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontWeight: 700 }}>Acțiuni</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      {item.operation_type?.name ??
                        operationTypeById.get(item.operation_type_id) ??
                        '—'}
                    </TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>
                      {item.resources && item.resources.length > 0 ? (
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                          {item.resources.slice(0, 3).map((r) => (
                            <Chip
                              key={r.id}
                              size="small"
                              variant="outlined"
                              label={`${r.resource?.name ?? r.resource_id}: ${r.quantity_per_unit}/${item.unit}`}
                            />
                          ))}
                          {item.resources.length > 3 && (
                            <Chip size="small" label={`+${item.resources.length - 3}`} />
                          )}
                        </Stack>
                      ) : (
                        '—'
                      )}
                    </TableCell>
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
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => openDeleteDialog(item)}
                          >
                            <DeleteOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                        Nu există template-uri de operațiuni.
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
      <Dialog open={formOpen} onClose={closeForm} fullWidth maxWidth="md">
        <DialogTitle>
          {formMode === 'create'
            ? 'Creează template operațiune'
            : formMode === 'edit'
              ? 'Editează template operațiune'
              : 'Detalii template'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            {/* Basic fields */}
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

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <FormControl fullWidth error={Boolean(formErrors.operationTypeId)}>
                <InputLabel id="op-type-label">Tip operațiune *</InputLabel>
                <Select
                  labelId="op-type-label"
                  label="Tip operațiune *"
                  value={formState.operationTypeId}
                  onChange={(e) => setFormState((p) => ({ ...p, operationTypeId: e.target.value }))}
                  disabled={submitting || isView}
                >
                  {(operationTypes ?? []).map((ot) => (
                    <MenuItem key={ot.id} value={String(ot.id)}>
                      {ot.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.operationTypeId && (
                  <FormHelperText>{formErrors.operationTypeId}</FormHelperText>
                )}
              </FormControl>

              <TextField
                label="Unitate de lucru"
                required
                value={formState.unit}
                onChange={(e) => setFormState((p) => ({ ...p, unit: e.target.value }))}
                disabled={submitting || isView}
                error={Boolean(formErrors.unit)}
                helperText={
                  formErrors.unit || 'Unitatea la care se raportează consumurile (ex: ha, km, buc).'
                }
                fullWidth
              />
            </Stack>

            <TextField
              label="Descriere"
              value={formState.description}
              onChange={(e) => setFormState((p) => ({ ...p, description: e.target.value }))}
              disabled={submitting || isView}
              multiline
              rows={2}
              fullWidth
            />

            {/* Machine Types */}
            <Divider />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Tipuri de mașini compatibile
            </Typography>
            <Autocomplete
              multiple
              value={machineTypes}
              onChange={(_, newValue) => {
                setMachineTypes(newValue)
                // Drop implement selections that are no longer compatible with any selected machine.
                if (compatibilities && newValue.length > 0) {
                  const allowed = new Set<string>()
                  for (const c of compatibilities) {
                    if (newValue.includes(c.machine_type)) allowed.add(c.implement_type)
                  }
                  setImplementTypes((prev) => prev.filter((t) => allowed.has(t)))
                }
              }}
              options={machineTypeOptions.map((o) => o.value)}
              getOptionLabel={(val) =>
                machineTypeOptions.find((o) => o.value === val)?.label ?? val
              }
              disabled={submitting || isView}
              renderValue={(value, getItemProps) =>
                value.map((option, index) => (
                  <Chip
                    size="small"
                    label={machineTypeOptions.find((o) => o.value === option)?.label ?? option}
                    {...getItemProps({ index })}
                    key={option}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField {...params} placeholder="Selectează tipuri de mașini" />
              )}
            />

            {/* Implement Types */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Tipuri de echipament compatibile
              {allowedImplementTypes && (
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                  sx={{ ml: 1 }}
                >
                  (filtrate după mașinile selectate)
                </Typography>
              )}
            </Typography>
            <Autocomplete
              multiple
              value={implementTypes}
              onChange={(_, newValue) => setImplementTypes(newValue)}
              options={availableImplementOptions.map((o) => o.value)}
              getOptionLabel={(val) =>
                implementTypeOptions.find((o) => o.value === val)?.label ?? val
              }
              disabled={submitting || isView}
              noOptionsText={
                machineTypes.length === 0
                  ? 'Selectează întâi tipuri de mașini'
                  : 'Niciun echipament compatibil'
              }
              renderValue={(value, getItemProps) =>
                value.map((option, index) => (
                  <Chip
                    size="small"
                    label={implementTypeOptions.find((o) => o.value === option)?.label ?? option}
                    {...getItemProps({ index })}
                    key={option}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField {...params} placeholder="Selectează tipuri de echipament" />
              )}
            />

            {/* Template Resources */}
            <Divider />
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Resurse necesare (per {formState.unit || 'unitate'})
              </Typography>
              {!isView && (
                <Button size="small" startIcon={<AddOutlined />} onClick={addResourceRow}>
                  Adaugă resursă
                </Button>
              )}
            </Stack>

            {resourceRows.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Nicio resursă adăugată.
              </Typography>
            )}

            {resourceRows.map((row, idx) => (
              <Stack
                key={idx}
                direction={{ xs: 'column', md: 'row' }}
                spacing={1.5}
                // alignItems="flex-start"
              >
                <FormControl sx={{ minWidth: 200, flex: 1 }}>
                  <InputLabel id={`res-label-${idx}`}>Resursă</InputLabel>
                  <Select
                    labelId={`res-label-${idx}`}
                    label="Resursă"
                    value={row.resource_id || ''}
                    onChange={(e) => updateResourceRow(idx, 'resource_id', Number(e.target.value))}
                    disabled={submitting || isView}
                    size="small"
                  >
                    {(resources ?? []).map((r) => (
                      <MenuItem key={r.id} value={r.id}>
                        {r.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label={`Cantitate / ${formState.unit || 'unitate'}`}
                  value={row.quantity_per_unit}
                  onChange={(e) => updateResourceRow(idx, 'quantity_per_unit', e.target.value)}
                  disabled={submitting || isView}
                  size="small"
                  sx={{ width: 150 }}
                  type="number"
                />
                <TextField
                  label="Note"
                  value={row.notes}
                  onChange={(e) => updateResourceRow(idx, 'notes', e.target.value)}
                  disabled={submitting || isView}
                  size="small"
                  sx={{ flex: 1 }}
                />
                {!isView && (
                  <IconButton color="error" onClick={() => removeResourceRow(idx)} size="small">
                    <RemoveCircleOutlined />
                  </IconButton>
                )}
              </Stack>
            ))}
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
        title="Șterge template"
        description={`Sigur vrei să ștergi template-ul „${toDelete?.name}"?`}
        confirmText="Șterge"
        onConfirm={handleDeleteConfirm}
        onClose={closeDelete}
        loading={deleteMutation.isPending}
      />
    </Box>
  )
}

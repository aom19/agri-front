import { useMemo, useState } from 'react'
import {
  AddOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
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
import type { Stock } from '../../api/resource.api'
import { ModalConfirmAction } from '../../components'
import { useHasPermission } from '../../hooks/usePermissions'
import { useResources } from '../../hooks/useResources'
import { useCreateStock, useDeleteStock, useStocks, useUpdateStock } from '../../hooks/useStocks'
import {
  stockFormSchema,
  type StockFormErrors,
  type StockFormValues,
} from '../../schemas/stock.schema'
import { useNotificationStore } from '../../store/notification.store'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'

type FormMode = 'create' | 'edit' | 'view'

const initialFormState: StockFormValues = {
  resourceId: '',
  quantity: '',
  minimumQuantity: '',
}

function mapStockToFormState(stock: Stock): StockFormValues {
  return {
    resourceId: String(stock.resource_id),
    quantity: String(stock.quantity),
    minimumQuantity: String(stock.minimum_quantity),
  }
}

function formatQuantity(value: number): string {
  return new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 4 }).format(value)
}

export default function StocksPage() {
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [formState, setFormState] = useState<StockFormValues>(initialFormState)
  const [formErrors, setFormErrors] = useState<StockFormErrors>({})
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [stockToDelete, setStockToDelete] = useState<Stock | null>(null)

  const show = useNotificationStore((state) => state.show)
  const canCreate = useHasPermission('stock.create')
  const canUpdate = useHasPermission('stock.update')
  const canDelete = useHasPermission('stock.delete')
  const { data: stocksData, isPending: stocksLoading } = useStocks()
  const { data: resourcesData, isPending: resourcesLoading } = useResources()
  const createStock = useCreateStock()
  const updateStock = useUpdateStock()
  const deleteStock = useDeleteStock()

  const submitting = createStock.isPending || updateStock.isPending
  const deleting = deleteStock.isPending
  const isPending = stocksLoading || resourcesLoading

  const resourceById = useMemo(
    () => new Map((resourcesData ?? []).map((resource) => [resource.id, resource])),
    [resourcesData]
  )

  const selectableResources = useMemo(() => {
    const resourceIDsWithStock = new Set((stocksData ?? []).map((stock) => stock.resource_id))

    return (resourcesData ?? []).filter(
      (resource) =>
        !resourceIDsWithStock.has(resource.id) || resource.id === selectedStock?.resource_id
    )
  }, [resourcesData, selectedStock?.resource_id, stocksData])

  const filteredStocks = useMemo(() => {
    const value = search.trim().toLowerCase()
    return [...(stocksData ?? [])]
      .filter((stock) => {
        if (!value) return true
        const resource = stock.resource ?? resourceById.get(stock.resource_id)
        return (
          resource?.name.toLowerCase().includes(value) ||
          resource?.resource_type?.name.toLowerCase().includes(value) ||
          resource?.resource_type?.default_unit.toLowerCase().includes(value)
        )
      })
      .sort((a, b) => {
        const nameA = (a.resource ?? resourceById.get(a.resource_id))?.name ?? ''
        const nameB = (b.resource ?? resourceById.get(b.resource_id))?.name ?? ''
        return nameA.localeCompare(nameB, 'ro')
      })
  }, [resourceById, search, stocksData])

  const openCreateDialog = () => {
    setSelectedStock(null)
    setFormMode('create')
    setFormState(initialFormState)
    setFormErrors({})
    setFormOpen(true)
  }

  const openEditDialog = (stock: Stock) => {
    setSelectedStock(stock)
    setFormMode('edit')
    setFormState(mapStockToFormState(stock))
    setFormErrors({})
    setFormOpen(true)
  }

  const openViewDialog = (stock: Stock) => {
    setSelectedStock(stock)
    setFormMode('view')
    setFormState(mapStockToFormState(stock))
    setFormErrors({})
    setFormOpen(true)
  }

  const closeFormDialog = () => {
    if (submitting) return
    setFormOpen(false)
    setFormErrors({})
  }

  const closeDeleteDialog = () => {
    if (deleting) return
    setDeleteOpen(false)
    setStockToDelete(null)
  }

  const handleSubmit = async () => {
    const validation = stockFormSchema.safeParse(formState)
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors
      const nextErrors: StockFormErrors = {}
      if (fieldErrors.resourceId?.[0]) nextErrors.resourceId = fieldErrors.resourceId[0]
      if (fieldErrors.quantity?.[0]) nextErrors.quantity = fieldErrors.quantity[0]
      if (fieldErrors.minimumQuantity?.[0])
        nextErrors.minimumQuantity = fieldErrors.minimumQuantity[0]
      setFormErrors(nextErrors)
      show('Verifică datele introduse în formular.', 'warning')
      return
    }

    const payload = {
      resource_id: Number(validation.data.resourceId),
      quantity: Number(validation.data.quantity),
      minimum_quantity: Number(validation.data.minimumQuantity),
    }

    try {
      if (formMode === 'create') {
        await createStock.mutateAsync(payload)
        show('Stocul a fost creat.', 'success')
      } else if (formMode === 'edit' && selectedStock) {
        await updateStock.mutateAsync({ id: String(selectedStock.id), payload })
        show('Stocul a fost actualizat.', 'success')
      }
      setFormOpen(false)
    } catch (error) {
      show(getApiErrorMessage(error, 'Nu am putut salva stocul.'), 'error')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!stockToDelete) return
    try {
      await deleteStock.mutateAsync(String(stockToDelete.id))
      show('Stocul a fost șters.', 'success')
      closeDeleteDialog()
    } catch (error) {
      show(getApiErrorMessage(error, 'Nu am putut șterge stocul.'), 'error')
    }
  }

  const isView = formMode === 'view'
  const selectedResource = resourceById.get(Number(formState.resourceId))

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 2, gap: 1.5 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Stocuri
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cantități disponibile și praguri minime pentru resurse.
          </Typography>
        </Box>
        {canCreate && (
          <Button
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={openCreateDialog}
            disabled={
              !resourcesLoading &&
              (resourcesData?.length ?? 0) > 0 &&
              selectableResources.length === 0
            }
          >
            Stoc nou
          </Button>
        )}
      </Stack>

      <Box sx={{ mb: 2 }}>
        <TextField
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          label="Caută stoc"
          placeholder="după resursă, tip sau unitate"
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
                    <Typography sx={{ fontWeight: 700 }}>Resursă</Typography>
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
                  <TableCell align="right">
                    <Typography sx={{ fontWeight: 700 }}>Acțiuni</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStocks.map((stock) => {
                  const resource = stock.resource ?? resourceById.get(stock.resource_id)
                  const unit = resource?.resource_type?.default_unit ?? ''
                  const isLow = stock.quantity <= stock.minimum_quantity
                  return (
                    <TableRow key={stock.id} hover>
                      <TableCell>{resource?.name ?? `Resursă #${stock.resource_id}`}</TableCell>
                      <TableCell>{resource?.resource_type?.name ?? '-'}</TableCell>
                      <TableCell>
                        {formatQuantity(stock.quantity)} {unit}
                      </TableCell>
                      <TableCell>
                        {formatQuantity(stock.minimum_quantity)} {unit}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={isLow ? 'warning' : 'success'}
                          label={isLow ? 'Stoc redus' : 'În limite'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Vezi detalii">
                          <IconButton
                            size="small"
                            onClick={() => openViewDialog(stock)}
                            aria-label="Vezi detalii"
                          >
                            <VisibilityOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {canUpdate && (
                          <Tooltip title="Editează stocul">
                            <IconButton
                              size="small"
                              onClick={() => openEditDialog(stock)}
                              aria-label="Editează stocul"
                            >
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canDelete && (
                          <Tooltip title="Șterge stocul">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setStockToDelete(stock)
                                setDeleteOpen(true)
                              }}
                              aria-label="Șterge stocul"
                            >
                              <DeleteOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filteredStocks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                        Nu există stocuri pentru filtrul curent.
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
            ? 'Creează stoc'
            : formMode === 'edit'
              ? 'Editează stoc'
              : 'Detalii stoc'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <FormControl fullWidth required error={Boolean(formErrors.resourceId)}>
              <InputLabel id="stock-resource-label">Resursă</InputLabel>
              <Select
                labelId="stock-resource-label"
                label="Resursă"
                value={formState.resourceId}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, resourceId: event.target.value }))
                }
                disabled={submitting || isView}
              >
                {selectableResources.map((resource) => (
                  <MenuItem key={resource.id} value={String(resource.id)}>
                    {resource.name}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.resourceId && <FormHelperText>{formErrors.resourceId}</FormHelperText>}
            </FormControl>
            {!isView && selectableResources.length === 0 && (
              <Alert severity="info">Toate resursele au deja o fișă de stoc.</Alert>
            )}
            {selectedResource?.resource_type && (
              <Alert severity="info">Unitate: {selectedResource.resource_type.default_unit}</Alert>
            )}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Cantitate"
                required
                value={formState.quantity}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, quantity: event.target.value }))
                }
                disabled={submitting || isView}
                error={Boolean(formErrors.quantity)}
                helperText={formErrors.quantity}
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
                helperText={formErrors.minimumQuantity}
                fullWidth
              />
            </Stack>
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
        title="Șterge stoc"
        description={
          stockToDelete
            ? `Confirmi ștergerea stocului pentru „${(stockToDelete.resource ?? resourceById.get(stockToDelete.resource_id))?.name ?? 'resursa selectată'}”?`
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

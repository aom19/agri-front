import { useState } from 'react'
import { CloseOutlined } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  ListSubheader,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import type { Resource } from '../../../api/resource.api'
import type { StockMovementType } from '../../../api/stockMovement.api'
import { useCreateStockMovement, useStockMovements } from '../../../hooks/useStockMovements'
import { useFieldCrops } from '../../../hooks/useCrops'
import { useNotificationStore } from '../../../store/notification.store'
import { getApiErrorMessage } from '../../../utils/getApiErrorMessage'
import { formatDateTime } from '../../../utils/dateFormat'

type StockMovementsDialogProps = {
  open: boolean
  resource: Resource | null
  unit: string
  canUpdate: boolean
  onClose: () => void
}

const typeMeta: Record<
  StockMovementType,
  { label: string; color: 'success' | 'warning' | 'default'; hint: string }
> = {
  in: {
    label: 'Intrare',
    color: 'success',
    hint: 'Recepție de la furnizor, recoltă sau produs secundar.',
  },
  out: {
    label: 'Ieșire',
    color: 'warning',
    hint: 'Consum în afara unei lucrări, vânzare sau pierdere.',
  },
  adjustment: {
    label: 'Ajustare',
    color: 'default',
    hint: 'Inventar: introduci nivelul numărat, iar diferența se înregistrează automat.',
  },
}

const quantityFormat = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 3 })
const moneyFormat = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 2 })

function parseDecimal(value: string) {
  return Number(value.replace(',', '.'))
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat('ro-RO', {
    maximumFractionDigits: 4,
    signDisplay: 'exceptZero',
  }).format(value)
}

export default function StockMovementsDialog({
  open,
  resource,
  unit,
  canUpdate,
  onClose,
}: StockMovementsDialogProps) {
  const show = useNotificationStore((state) => state.show)
  const resourceId = resource?.id ?? 0
  const {
    data: movements,
    isPending,
    isError,
  } = useStockMovements({ resource_id: resourceId }, open && resourceId > 0)
  const createMovement = useCreateStockMovement()
  const [type, setType] = useState<StockMovementType>('in')
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [notes, setNotes] = useState('')
  const [fieldCropId, setFieldCropId] = useState('')
  const [error, setError] = useState<string | null>(null)
  // produs secundar (ex. paie): intrarea se leagă de cultura pe teren care l-a produs. Paiele se
  // balotează adesea după ce grâul a fost închis, deci culturile închise rămân disponibile.
  const { data: fieldCrops } = useFieldCrops()
  const openCrops = (fieldCrops ?? []).filter((fc) => fc.status === 'open')
  const closedCrops = (fieldCrops ?? [])
    .filter((fc) => fc.status !== 'open')
    .sort((a, b) => (b.closed_at ?? '').localeCompare(a.closed_at ?? ''))
  const hasCrops = openCrops.length + closedCrops.length > 0

  // stocul după mișcare, calculat ca în API: intrarea adună, ieșirea scade, ajustarea fixează nivelul
  const currentQuantity = resource?.quantity ?? 0
  const parsedPreview = quantity.trim() === '' ? null : parseDecimal(quantity)
  const resultingQuantity =
    parsedPreview == null || !Number.isFinite(parsedPreview)
      ? null
      : type === 'in'
        ? currentQuantity + parsedPreview
        : type === 'out'
          ? currentQuantity - parsedPreview
          : parsedPreview
  const belowZero = resultingQuantity != null && resultingQuantity < 0
  const belowMinimum =
    resource != null &&
    resource.minimum_quantity > 0 &&
    resultingQuantity != null &&
    resultingQuantity >= 0 &&
    resultingQuantity < resource.minimum_quantity

  const changeType = (next: StockMovementType | null) => {
    if (!next) return
    setType(next)
    setError(null)
    if (next !== 'in') setFieldCropId('')
  }

  const submit = () => {
    const parsedQuantity = parseDecimal(quantity)
    if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity < 0 ||
      (type !== 'adjustment' && parsedQuantity === 0)
    ) {
      setError(
        type === 'adjustment'
          ? 'Introdu noul nivel al stocului.'
          : 'Cantitatea trebuie să fie pozitivă.'
      )
      return
    }
    if (type === 'out' && parsedQuantity > currentQuantity) {
      setError(
        `Ieșirea depășește stocul curent (${quantityFormat.format(currentQuantity)} ${unit}).`
      )
      return
    }
    const parsedCost = unitCost.trim() === '' ? null : parseDecimal(unitCost)
    if (parsedCost !== null && (!Number.isFinite(parsedCost) || parsedCost < 0)) {
      setError('Costul unitar trebuie să fie un număr pozitiv.')
      return
    }
    setError(null)
    createMovement.mutate(
      {
        resource_id: resourceId,
        movement_type: type,
        quantity: parsedQuantity,
        unit_cost: parsedCost,
        field_crop_id: type === 'in' && fieldCropId ? Number(fieldCropId) : null,
        notes,
      },
      {
        onSuccess: () => {
          show('Mișcarea de stoc a fost înregistrată.', 'success')
          setQuantity('')
          setUnitCost('')
          setNotes('')
          setFieldCropId('')
        },
        onError: (mutationError) =>
          setError(getApiErrorMessage(mutationError, 'Nu am putut înregistra mișcarea.')),
      }
    )
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle component="div" sx={{ pr: 6 }}>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.78rem', fontWeight: 700 }}>
          Mișcări de stoc
        </Typography>
        <Typography sx={{ fontWeight: 900, fontSize: '1.3rem' }}>{resource?.name}</Typography>
        {resource && (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
              Stoc curent: {quantityFormat.format(resource.quantity)} {unit}
              {resource.minimum_quantity > 0
                ? ` · prag minim ${quantityFormat.format(resource.minimum_quantity)} ${unit}`
                : ''}
            </Typography>
            {resource.minimum_quantity > 0 && resource.quantity < resource.minimum_quantity && (
              <Chip size="small" color="error" variant="outlined" label="Sub pragul minim" />
            )}
          </Stack>
        )}
        <IconButton
          aria-label="Închide"
          onClick={onClose}
          sx={{ position: 'absolute', right: 12, top: 12 }}
        >
          <CloseOutlined />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 0, pb: 3 }}>
        <Stack spacing={2.5}>
          {canUpdate && (
            <Box sx={{ p: 2, borderRadius: '14px', bgcolor: '#f5f8f5' }}>
              <Typography sx={{ fontWeight: 700, mb: 1.5 }}>Înregistrează o mișcare</Typography>
              <Stack spacing={1.5}>
                <Box>
                  <ToggleButtonGroup
                    exclusive
                    size="small"
                    color="primary"
                    value={type}
                    onChange={(_, next: StockMovementType | null) => changeType(next)}
                    aria-label="Tip mișcare"
                  >
                    <ToggleButton value="in">Intrare</ToggleButton>
                    <ToggleButton value="out">Ieșire</ToggleButton>
                    <ToggleButton value="adjustment">Ajustare</ToggleButton>
                  </ToggleButtonGroup>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.78rem', mt: 0.5 }}>
                    {typeMeta[type].hint}
                  </Typography>
                </Box>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                  <TextField
                    size="small"
                    label={type === 'adjustment' ? `Nivel nou (${unit})` : `Cantitate (${unit})`}
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    slotProps={{ htmlInput: { inputMode: 'decimal' } }}
                    error={belowZero}
                    helperText={
                      resultingQuantity == null
                        ? ' '
                        : `Stoc după mișcare: ${quantityFormat.format(resultingQuantity)} ${unit}`
                    }
                    fullWidth
                  />
                  <TextField
                    size="small"
                    label="Cost unitar (opțional)"
                    value={unitCost}
                    onChange={(event) => setUnitCost(event.target.value)}
                    slotProps={{ htmlInput: { inputMode: 'decimal' } }}
                    helperText={
                      resource
                        ? `Implicit prețul resursei: ${moneyFormat.format(resource.price_per_unit)} lei`
                        : ' '
                    }
                    fullWidth
                  />
                  {type === 'in' && hasCrops && (
                    <TextField
                      select
                      size="small"
                      label="Cultură pe teren (opțional)"
                      value={fieldCropId}
                      onChange={(event) => setFieldCropId(event.target.value)}
                      helperText="Pentru produse secundare: paie, furaj"
                      fullWidth
                    >
                      <MenuItem value="">
                        <em>Fără cultură</em>
                      </MenuItem>
                      {openCrops.length > 0 && <ListSubheader>Deschise</ListSubheader>}
                      {openCrops.map((fc) => (
                        <MenuItem key={fc.id} value={String(fc.id)}>
                          {fc.crop_name} · {fc.field_name} · {fc.season_name}
                        </MenuItem>
                      ))}
                      {closedCrops.length > 0 && <ListSubheader>Închise</ListSubheader>}
                      {closedCrops.map((fc) => (
                        <MenuItem key={fc.id} value={String(fc.id)}>
                          {fc.crop_name} · {fc.field_name} · {fc.season_name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                </Stack>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={1.5}
                  sx={{ alignItems: { md: 'flex-start' } }}
                >
                  <TextField
                    size="small"
                    label="Observații"
                    placeholder={
                      type === 'in'
                        ? 'ex. factura 1182/2026'
                        : type === 'out'
                          ? 'ex. vânzare, contract 45'
                          : 'ex. inventar 15.10'
                    }
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    fullWidth
                  />
                  <Button
                    variant="contained"
                    onClick={submit}
                    disabled={createMovement.isPending || belowZero}
                    sx={{ flexShrink: 0, minWidth: 120 }}
                  >
                    {createMovement.isPending ? 'Se salvează...' : 'Salvează'}
                  </Button>
                </Stack>
                {belowZero && (
                  <Alert severity="error" sx={{ py: 0 }}>
                    Ieșirea depășește stocul curent ({quantityFormat.format(currentQuantity)} {unit}
                    ).
                  </Alert>
                )}
                {belowMinimum && (
                  <Alert severity="warning" sx={{ py: 0 }}>
                    După mișcare, stocul scade sub pragul minim (
                    {quantityFormat.format(resource!.minimum_quantity)} {unit}).
                  </Alert>
                )}
              </Stack>
              {error && (
                <Alert severity="error" sx={{ mt: 1.5 }}>
                  {error}
                </Alert>
              )}
            </Box>
          )}

          <Box>
            <Typography sx={{ fontWeight: 700, mb: 1 }}>Istoric</Typography>
            {isPending ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : isError ? (
              <Alert severity="error">Nu am putut încărca istoricul mișcărilor.</Alert>
            ) : (movements ?? []).length === 0 ? (
              <Typography
                sx={{ color: 'text.secondary', fontSize: '0.85rem', py: 2, textAlign: 'center' }}
              >
                Nu există mișcări înregistrate pentru această resursă.
              </Typography>
            ) : (
              <Box sx={{ overflow: 'auto', maxHeight: 360 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Data</TableCell>
                      <TableCell>Tip</TableCell>
                      <TableCell align="right">Variație</TableCell>
                      <TableCell align="right">Rămas</TableCell>
                      <TableCell align="right">Valoare (lei)</TableCell>
                      <TableCell>Sursă</TableCell>
                      <TableCell>Autor</TableCell>
                      <TableCell>Observații</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(movements ?? []).map((movement) => (
                      <TableRow key={movement.id} hover>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {formatDateTime(movement.created_at)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={typeMeta[movement.movement_type].color}
                            label={typeMeta[movement.movement_type].label}
                          />
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}
                        >
                          {formatQuantity(movement.quantity_delta)} {movement.unit}
                        </TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {quantityFormat.format(movement.resulting_quantity)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {movement.total_cost == null
                            ? '-'
                            : moneyFormat.format(movement.total_cost)}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 200, whiteSpace: 'normal' }}>
                          {movement.field_operation_label ?? 'Manuală'}
                        </TableCell>
                        <TableCell>{movement.actor_name ?? 'Sistem'}</TableCell>
                        <TableCell sx={{ maxWidth: 220, whiteSpace: 'normal' }}>
                          {movement.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}

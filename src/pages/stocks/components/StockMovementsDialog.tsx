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
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import type { Stock } from '../../../api/resource.api'
import type { StockMovementType } from '../../../api/stockMovement.api'
import { useCreateStockMovement, useStockMovements } from '../../../hooks/useStockMovements'
import { useNotificationStore } from '../../../store/notification.store'
import { getApiErrorMessage } from '../../../utils/getApiErrorMessage'

type StockMovementsDialogProps = {
  open: boolean
  stock: Stock | null
  unit: string
  resourceName: string
  canUpdate: boolean
  onClose: () => void
}

const typeMeta: Record<
  StockMovementType,
  { label: string; color: 'success' | 'warning' | 'default' }
> = {
  in: { label: 'Intrare', color: 'success' },
  out: { label: 'Ieșire', color: 'warning' },
  adjustment: { label: 'Ajustare', color: 'default' },
}

const dateFormat = new Intl.DateTimeFormat('ro-RO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function formatQuantity(value: number) {
  return new Intl.NumberFormat('ro-RO', {
    maximumFractionDigits: 3,
    signDisplay: 'exceptZero',
  }).format(value)
}

export default function StockMovementsDialog({
  open,
  stock,
  unit,
  resourceName,
  canUpdate,
  onClose,
}: StockMovementsDialogProps) {
  const show = useNotificationStore((state) => state.show)
  const stockId = stock ? Number(stock.id) : 0
  const {
    data: movements,
    isPending,
    isError,
  } = useStockMovements({ stock_id: stockId }, open && stockId > 0)
  const createMovement = useCreateStockMovement()
  const [type, setType] = useState<StockMovementType>('in')
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    const parsedQuantity = Number(quantity.replace(',', '.'))
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
    const parsedCost = unitCost.trim() === '' ? null : Number(unitCost.replace(',', '.'))
    if (parsedCost !== null && (!Number.isFinite(parsedCost) || parsedCost < 0)) {
      setError('Costul unitar trebuie să fie un număr pozitiv.')
      return
    }
    setError(null)
    createMovement.mutate(
      {
        stock_id: stockId,
        movement_type: type,
        quantity: parsedQuantity,
        unit_cost: parsedCost,
        notes,
      },
      {
        onSuccess: () => {
          show('Mișcarea de stoc a fost înregistrată.', 'success')
          setQuantity('')
          setUnitCost('')
          setNotes('')
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
        <Typography sx={{ fontWeight: 900, fontSize: '1.3rem' }}>{resourceName}</Typography>
        {stock && (
          <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
            Stoc curent:{' '}
            {new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 3 }).format(stock.quantity)}{' '}
            {unit}
          </Typography>
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
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={1.5}
                sx={{ alignItems: 'flex-start' }}
              >
                <TextField
                  select
                  size="small"
                  label="Tip"
                  value={type}
                  onChange={(event) => setType(event.target.value as StockMovementType)}
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="in">Intrare (recepție)</MenuItem>
                  <MenuItem value="out">Ieșire (consum)</MenuItem>
                  <MenuItem value="adjustment">Ajustare (nivel nou)</MenuItem>
                </TextField>
                <TextField
                  size="small"
                  label={type === 'adjustment' ? `Nivel nou (${unit})` : `Cantitate (${unit})`}
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  slotProps={{ htmlInput: { inputMode: 'decimal' } }}
                  sx={{ minWidth: 160 }}
                />
                <TextField
                  size="small"
                  label="Cost unitar (opțional)"
                  value={unitCost}
                  onChange={(event) => setUnitCost(event.target.value)}
                  slotProps={{ htmlInput: { inputMode: 'decimal' } }}
                  sx={{ minWidth: 160 }}
                  helperText="Implicit prețul resursei"
                />
                <TextField
                  size="small"
                  label="Observații"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  fullWidth
                />
                <Button
                  variant="contained"
                  onClick={submit}
                  disabled={createMovement.isPending}
                  sx={{ flexShrink: 0 }}
                >
                  {createMovement.isPending ? 'Se salvează...' : 'Salvează'}
                </Button>
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
                Nu există mișcări înregistrate pentru acest stoc.
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
                      <TableCell align="right">Valoare</TableCell>
                      <TableCell>Lucrare</TableCell>
                      <TableCell>Autor</TableCell>
                      <TableCell>Observații</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(movements ?? []).map((movement) => (
                      <TableRow key={movement.id} hover>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {dateFormat.format(new Date(movement.created_at))}
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
                          {new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 3 }).format(
                            movement.resulting_quantity
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {movement.total_cost == null
                            ? '-'
                            : new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 2 }).format(
                                movement.total_cost
                              )}
                        </TableCell>
                        <TableCell>{movement.field_operation_label ?? '-'}</TableCell>
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

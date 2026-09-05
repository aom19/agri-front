import { useMemo, useState } from 'react'
import { CloseOutlined, TaskAltOutlined } from '@mui/icons-material'
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import type { FieldOperation } from '../../../api/fieldOperation.api'
import { useCompleteFieldOperation } from '../../../hooks/useFieldOperations'
import { useOperationTemplate } from '../../../hooks/useOperations'
import { useNotificationStore } from '../../../store/notification.store'
import { getApiErrorMessage } from '../../../utils/getApiErrorMessage'

type ResourceRow = {
  resourceId: number
  name: string
  quantityPerUnit: number
  quantity: string
}

function computeQuantity(quantityPerUnit: number, area: number | null) {
  if (area == null) return ''
  return String(Number((quantityPerUnit * area).toFixed(3)))
}

type CompleteOperationDialogProps = {
  open: boolean
  operation: FieldOperation
  onClose: () => void
}

function toNumber(value: string): number | null {
  if (value.trim() === '') return null
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 3 }).format(value)
}

export default function CompleteOperationDialog({
  open,
  operation,
  onClose,
}: CompleteOperationDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      {open && <CompleteOperationForm operation={operation} onClose={onClose} />}
    </Dialog>
  )
}

type CompleteOperationFormProps = {
  operation: FieldOperation
  onClose: () => void
}

// Formularul este montat doar cât timp dialogul este deschis, deci pornește mereu cu valori curate.
function CompleteOperationForm({ operation, onClose }: CompleteOperationFormProps) {
  const show = useNotificationStore((state) => state.show)
  const complete = useCompleteFieldOperation()
  const { data: template } = useOperationTemplate(operation.operation_template_id ?? null)

  const [area, setArea] = useState(
    operation.area_planned_ha != null ? String(operation.area_planned_ha) : ''
  )
  const [fuel, setFuel] = useState('')
  const [hours, setHours] = useState('')
  const [notes, setNotes] = useState('')
  const [consume, setConsume] = useState(true)
  const [overrides, setOverrides] = useState<Record<number, string>>({})
  const [error, setError] = useState<string | null>(null)

  const templateResources = useMemo(() => template?.resources ?? [], [template])
  const rows = useMemo<ResourceRow[]>(() => {
    const areaValue = toNumber(area)
    return templateResources.map((item) => ({
      resourceId: item.resource_id,
      name: item.resource?.name ?? `Resursa #${item.resource_id}`,
      quantityPerUnit: item.quantity_per_unit,
      quantity: overrides[item.resource_id] ?? computeQuantity(item.quantity_per_unit, areaValue),
    }))
  }, [templateResources, overrides, area])

  const recalculateFromArea = (value: string) => {
    setArea(value)
    setOverrides({})
  }

  const handleSubmit = () => {
    const areaValue = toNumber(area)
    const fuelValue = toNumber(fuel)
    const hoursValue = toNumber(hours)
    if (area.trim() !== '' && (areaValue == null || areaValue < 0)) {
      setError('Suprafața realizată trebuie să fie un număr pozitiv.')
      return
    }
    if (fuel.trim() !== '' && (fuelValue == null || fuelValue < 0)) {
      setError('Combustibilul consumat trebuie să fie un număr pozitiv.')
      return
    }
    if (hours.trim() !== '' && (hoursValue == null || hoursValue < 0)) {
      setError('Orele de mașină trebuie să fie un număr pozitiv.')
      return
    }
    const resources = consume
      ? rows
          .map((row) => ({ resource_id: row.resourceId, quantity: toNumber(row.quantity) ?? 0 }))
          .filter((row) => row.quantity > 0)
      : []
    setError(null)

    complete.mutate(
      {
        id: operation.id,
        payload: {
          area_completed_ha: areaValue,
          fuel_used_l: fuelValue,
          machine_hours: hoursValue,
          notes,
          resources,
          consume_from_template: false,
        },
      },
      {
        onSuccess: (result) => {
          show(
            result.movements.length > 0
              ? `Lucrarea a fost finalizată. ${result.movements.length} resurse scăzute din stoc.`
              : 'Lucrarea a fost finalizată.',
            'success'
          )
          onClose()
        },
        onError: (mutationError) => {
          setError(getApiErrorMessage(mutationError, 'Nu am putut finaliza lucrarea.'))
        },
      }
    )
  }

  return (
    <>
      <DialogTitle component="div" sx={{ pr: 6 }}>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.78rem', fontWeight: 700 }}>
          Finalizare lucrare
        </Typography>
        <Typography sx={{ fontWeight: 900, fontSize: '1.35rem' }}>
          {operation.operation_type_name} · {operation.field_name}
        </Typography>
        <IconButton
          aria-label="Închide"
          onClick={onClose}
          sx={{ position: 'absolute', right: 12, top: 12 }}
        >
          <CloseOutlined />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        <Stack spacing={2}>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
            Înregistrează datele reale ale lucrării. Momentul finalizării este acum, iar durata
            reală se calculează față de momentul pornirii.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label="Suprafață realizată (ha)"
              value={area}
              onChange={(event) => recalculateFromArea(event.target.value)}
              size="small"
              fullWidth
              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
            />
            <TextField
              label="Combustibil consumat (l)"
              value={fuel}
              onChange={(event) => setFuel(event.target.value)}
              size="small"
              fullWidth
              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
            />
            <TextField
              label="Ore de mașină"
              value={hours}
              onChange={(event) => setHours(event.target.value)}
              size="small"
              fullWidth
              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
              helperText={operation.machine_id ? 'Se adaugă la orele mașinii' : undefined}
            />
          </Stack>
          <TextField
            label="Observații la finalizare"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            size="small"
            fullWidth
            multiline
            minRows={2}
          />

          {rows.length > 0 ? (
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={consume}
                    onChange={(event) => setConsume(event.target.checked)}
                  />
                }
                label="Scade din stoc resursele consumate (conform șablonului, ajustabile)"
              />
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Resursă</TableCell>
                    <TableCell align="right">Normă / ha</TableCell>
                    <TableCell align="right" sx={{ width: 160 }}>
                      Cantitate consumată
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.resourceId}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell align="right">{formatQuantity(row.quantityPerUnit)}</TableCell>
                      <TableCell align="right">
                        <TextField
                          value={row.quantity}
                          onChange={(event) =>
                            setOverrides((current) => ({
                              ...current,
                              [row.resourceId]: event.target.value,
                            }))
                          }
                          size="small"
                          disabled={!consume}
                          slotProps={{
                            htmlInput: { inputMode: 'decimal', style: { textAlign: 'right' } },
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Stack>
          ) : (
            <Alert severity="info">
              Lucrarea nu are șablon cu resurse, deci nu se generează mișcări de stoc. Consumurile
              pot fi înregistrate manual din pagina Stocuri.
            </Alert>
          )}

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={complete.isPending}>
          Renunță
        </Button>
        <Button
          variant="contained"
          startIcon={<TaskAltOutlined />}
          onClick={handleSubmit}
          disabled={complete.isPending}
        >
          {complete.isPending ? 'Se finalizează...' : 'Finalizează lucrarea'}
        </Button>
      </DialogActions>
    </>
  )
}

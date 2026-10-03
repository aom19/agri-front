import { useMemo, useState } from 'react'
import { CloseOutlined, TaskAltOutlined } from '@mui/icons-material'
import {
  Alert,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
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
import type { FieldOperation, FieldOperationResourceUsage } from '../../../api/fieldOperation.api'
import {
  useCompleteFieldOperation,
  useConsumptionEstimate,
} from '../../../hooks/useFieldOperations'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { useNotificationStore } from '../../../store/notification.store'
import { getApiErrorMessage } from '../../../utils/getApiErrorMessage'
import { defaultFuelResourceId, formatQuantity, toNumber } from '../completion.helpers'

type CompleteOperationDialogProps = {
  open: boolean
  operation: FieldOperation
  onClose: () => void
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
// Consumul după normă este calculat doar de server: formularul afișează estimarea primită și
// trimite doar corecțiile făcute de utilizator.
function CompleteOperationForm({ operation, onClose }: CompleteOperationFormProps) {
  const show = useNotificationStore((state) => state.show)
  const complete = useCompleteFieldOperation()

  const [area, setArea] = useState(
    operation.area_planned_ha != null ? String(operation.area_planned_ha) : ''
  )
  const [fuel, setFuel] = useState('')
  const [fuelResource, setFuelResource] = useState('')
  const [hours, setHours] = useState('')
  const [notes, setNotes] = useState('')
  const [consume, setConsume] = useState(true)
  const [overrides, setOverrides] = useState<Record<number, string>>({})
  const [error, setError] = useState<string | null>(null)

  const areaValue = toNumber(area)
  const estimateArea = useDebouncedValue(
    areaValue != null && areaValue >= 0 ? areaValue : null,
    300
  )
  const {
    data: estimate,
    isPending: estimateLoading,
    isFetching: estimateFetching,
  } = useConsumptionEstimate(operation.id, estimateArea)

  const fuelValue = toNumber(fuel)
  const fuelResources = useMemo(() => estimate?.fuel_resources ?? [], [estimate])
  const fuelResourceId =
    fuelResource !== '' ? Number(fuelResource) : defaultFuelResourceId(estimate)
  const fuelResourceUnit =
    fuelResources.find((item) => item.resource_id === fuelResourceId)?.unit ?? 'l'
  // Consumul resursei de combustibil alese vine doar din câmpul de combustibil.
  const fuelOverridesRow = (resourceId: number) =>
    fuelValue != null && resourceId === fuelResourceId

  const rows = estimate?.items ?? []

  const recalculateFromArea = (value: string) => {
    setArea(value)
    setOverrides({})
  }

  const handleSubmit = () => {
    const hoursValue = toNumber(hours)
    if (area.trim() !== '' && (areaValue == null || areaValue < 0)) {
      setError('Suprafața realizată trebuie să fie un număr pozitiv.')
      return
    }
    if (fuel.trim() !== '' && (fuelValue == null || fuelValue < 0)) {
      setError('Combustibilul consumat trebuie să fie un număr pozitiv.')
      return
    }
    if (fuelValue != null && fuelValue > 0 && fuelResourceId == null) {
      setError('Alege resursa de combustibil din care se scade consumul.')
      return
    }
    if (hours.trim() !== '' && (hoursValue == null || hoursValue < 0)) {
      setError('Orele de mașină trebuie să fie un număr pozitiv.')
      return
    }
    const resources: FieldOperationResourceUsage[] = []
    if (consume) {
      for (const [resourceId, value] of Object.entries(overrides)) {
        const quantity = toNumber(value)
        if (quantity == null || quantity < 0) {
          setError('Cantitățile consumate trebuie să fie numere pozitive.')
          return
        }
        resources.push({ resource_id: Number(resourceId), quantity })
      }
    }
    setError(null)

    complete.mutate(
      {
        id: operation.id,
        payload: {
          area_completed_ha: areaValue,
          fuel_used_l: fuelValue,
          fuel_resource_id: fuelValue != null ? fuelResourceId : null,
          machine_hours: hoursValue,
          notes,
          resources,
          consume_from_template: consume,
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
              label="Ore de mașină"
              value={hours}
              onChange={(event) => setHours(event.target.value)}
              size="small"
              fullWidth
              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
              helperText={operation.machine_id ? 'Se adaugă la orele mașinii' : undefined}
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label={`Combustibil consumat (${fuelResourceUnit})`}
              value={fuel}
              onChange={(event) => setFuel(event.target.value)}
              size="small"
              fullWidth
              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
              helperText="Se scade din stoc și apare în rapoarte"
            />
            <TextField
              select
              label="Din stocul"
              value={fuelResourceId != null ? String(fuelResourceId) : ''}
              onChange={(event) => setFuelResource(event.target.value)}
              size="small"
              fullWidth
              disabled={fuelResources.length === 0}
              helperText={
                !estimateLoading && fuelResources.length === 0
                  ? 'Nu există stoc de combustibil'
                  : undefined
              }
            >
              {fuelResources.map((item) => (
                <MenuItem key={item.resource_id} value={String(item.resource_id)}>
                  {item.resource_name} ({formatQuantity(item.quantity)} {item.unit})
                </MenuItem>
              ))}
            </TextField>
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

          {estimateLoading ? (
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', color: 'text.secondary' }}
            >
              <CircularProgress size={16} />
              <Typography sx={{ fontSize: '0.85rem' }}>
                Se calculează consumul estimat...
              </Typography>
            </Stack>
          ) : rows.length > 0 ? (
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={consume}
                    onChange={(event) => setConsume(event.target.checked)}
                  />
                }
                label="Scade din stoc resursele consumate (după normele șablonului, ajustabile)"
              />
              <Table size="small" sx={{ opacity: estimateFetching ? 0.6 : 1 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Resursă</TableCell>
                    <TableCell align="right">Normă / ha</TableCell>
                    <TableCell align="right" sx={{ width: 170 }}>
                      Cantitate consumată
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => {
                    const fromFuelField = fuelOverridesRow(row.resource_id)
                    const override = overrides[row.resource_id]
                    const isEstimate = override == null && !fromFuelField
                    return (
                      <TableRow key={row.resource_id}>
                        <TableCell>{row.resource_name}</TableCell>
                        <TableCell align="right">
                          {formatQuantity(row.quantity_per_unit)} {row.unit}
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            value={
                              fromFuelField ? String(fuelValue) : (override ?? String(row.quantity))
                            }
                            onChange={(event) =>
                              setOverrides((current) => ({
                                ...current,
                                [row.resource_id]: event.target.value,
                              }))
                            }
                            size="small"
                            disabled={!consume || fromFuelField}
                            helperText={
                              fromFuelField
                                ? 'din câmpul de combustibil'
                                : isEstimate
                                  ? undefined
                                  : `estimare: ${formatQuantity(row.quantity)}`
                            }
                            slotProps={{
                              htmlInput: {
                                inputMode: 'decimal',
                                style: { textAlign: 'right' },
                                'aria-label': `Cantitate consumată ${row.resource_name}`,
                              },
                              input: {
                                startAdornment: isEstimate ? (
                                  <Chip label="estimare" size="small" sx={{ mr: 1 }} />
                                ) : undefined,
                              },
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.78rem' }}>
                Estimarea este normă × suprafață realizată și se recalculează când schimbi
                suprafața. Valorile modificate înlocuiesc estimarea.
              </Typography>
            </Stack>
          ) : (
            <Alert severity="info">
              Lucrarea nu are șablon cu resurse. Din stoc se scade doar combustibilul raportat; alte
              consumuri pot fi înregistrate manual din pagina Stocuri.
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

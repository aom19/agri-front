import { useState } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { Crop, FieldCrop, FieldCropPayload, Season } from '../../../api/crops.api'
import { useCreateFieldCrop, useUpdateFieldCrop } from '../../../hooks/useCrops'
import { useFields } from '../../../hooks/useFields'
import { useNotificationStore } from '../../../store/notification.store'
import { getApiErrorMessage } from '../../../utils/getApiErrorMessage'
import { formatNumber, toOptionalNumber } from './cropFormat'

type FieldCropDialogProps = {
  open: boolean
  item: FieldCrop | null
  defaultFieldId?: string
  defaultSeasonId: number | null
  seasons: Season[]
  crops: Crop[]
  onClose: () => void
}

export default function FieldCropDialog(props: FieldCropDialogProps) {
  return (
    <Dialog open={props.open} onClose={props.onClose} fullWidth maxWidth="sm">
      {props.open && <FieldCropForm {...props} />}
    </Dialog>
  )
}

function FieldCropForm({
  item,
  defaultFieldId,
  defaultSeasonId,
  seasons,
  crops,
  onClose,
}: FieldCropDialogProps) {
  const show = useNotificationStore((state) => state.show)
  const { data: fields } = useFields()
  const create = useCreateFieldCrop()
  const update = useUpdateFieldCrop()
  const [fieldId, setFieldId] = useState(item?.field_id ?? defaultFieldId ?? '')
  const [seasonId, setSeasonId] = useState(
    String(item?.season_id ?? defaultSeasonId ?? seasons[0]?.id ?? '')
  )
  const [cropId, setCropId] = useState(String(item?.crop_id ?? crops[0]?.id ?? ''))
  const isEdit = Boolean(item)
  // deschis de pe rândul unui teren fără cultură: suprafața se preia din teren, ca la alegerea lui
  const defaultFieldArea = (fields ?? []).find((field) => field.id === defaultFieldId)?.area_ha
  const [plantedArea, setPlantedArea] = useState(
    item?.planted_area_ha != null
      ? String(item.planted_area_ha)
      : defaultFieldArea != null
        ? String(defaultFieldArea)
        : ''
  )
  const [plantedAt, setPlantedAt] = useState(item?.planted_at ?? '')
  const [harvestedAt, setHarvestedAt] = useState(item?.harvested_at ?? '')
  const [production, setProduction] = useState(
    item?.production_total != null ? String(item.production_total) : ''
  )
  const [expectedYield, setExpectedYield] = useState(
    item?.expected_yield_per_ha != null ? String(item.expected_yield_per_ha) : ''
  )
  const [notes, setNotes] = useState(item?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const pending = create.isPending || update.isPending
  const selectedField = (fields ?? []).find((field) => field.id === fieldId)

  // la atribuire, suprafața cultivată se preia din teren; rămâne editabilă (ex. jumătate de tarla)
  const handleFieldChange = (value: string) => {
    setFieldId(value)
    const field = (fields ?? []).find((f) => f.id === value)
    if (!isEdit && field?.area_ha != null) setPlantedArea(String(field.area_ha))
  }

  const submit = () => {
    if (!fieldId || !seasonId || !cropId) {
      setError('Terenul, sezonul și cultura sunt obligatorii.')
      return
    }
    const numbers = {
      planted: toOptionalNumber(plantedArea),
      production: toOptionalNumber(production),
      expected: toOptionalNumber(expectedYield),
    }
    if (
      Object.values(numbers).some((value) => value != null && (Number.isNaN(value) || value < 0))
    ) {
      setError('Valorile numerice trebuie să fie pozitive.')
      return
    }
    setError(null)
    const payload: FieldCropPayload = {
      field_id: fieldId,
      season_id: Number(seasonId),
      crop_id: Number(cropId),
      planted_area_ha: numbers.planted,
      planted_at: plantedAt || null,
      harvested_at: harvestedAt || null,
      production_total: numbers.production,
      expected_yield_per_ha: numbers.expected,
      notes,
    }
    const options = {
      onSuccess: () => {
        show(
          item ? 'Cultura pe teren a fost actualizată.' : 'Cultura a fost atribuită terenului.',
          'success'
        )
        onClose()
      },
      onError: (mutationError: unknown) =>
        setError(getApiErrorMessage(mutationError, 'Nu am putut salva înregistrarea.')),
    }
    if (item) update.mutate({ id: item.id, payload }, options)
    else create.mutate(payload, options)
  }

  return (
    <>
      <DialogTitle>
        {item ? 'Editează cultura pe teren' : 'Atribuie o cultură unui teren'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              select
              label="Teren"
              value={fieldId}
              onChange={(event) => handleFieldChange(event.target.value)}
              size="small"
              fullWidth
              disabled={Boolean(item)}
            >
              {(fields ?? []).map((field) => (
                <MenuItem key={field.id} value={field.id}>
                  {field.name}
                  {field.area_ha != null ? ` · ${formatNumber(field.area_ha, 1)} ha` : ''}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Sezon"
              value={seasonId}
              onChange={(event) => setSeasonId(event.target.value)}
              size="small"
              fullWidth
              disabled={Boolean(item)}
            >
              {seasons.map((season) => (
                <MenuItem key={season.id} value={String(season.id)}>
                  {season.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              select
              label="Cultură"
              value={cropId}
              onChange={(event) => setCropId(event.target.value)}
              size="small"
              fullWidth
            >
              {crops.map((crop) => (
                <MenuItem key={crop.id} value={String(crop.id)}>
                  {crop.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Suprafață cultivată (ha)"
              value={plantedArea}
              onChange={(event) => setPlantedArea(event.target.value)}
              size="small"
              fullWidth
              helperText={
                selectedField?.area_ha != null
                  ? `Preluată din teren (${formatNumber(selectedField.area_ha, 2)} ha); modific-o doar dacă semeni o parte`
                  : undefined
              }
              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
            />
          </Stack>
          {isEdit ? (
            <>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  label="Semănat la"
                  type="date"
                  value={plantedAt}
                  onChange={(event) => setPlantedAt(event.target.value)}
                  size="small"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="Recoltat la"
                  type="date"
                  value={harvestedAt}
                  onChange={(event) => setHarvestedAt(event.target.value)}
                  size="small"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  label="Producție obținută"
                  value={production}
                  onChange={(event) => setProduction(event.target.value)}
                  size="small"
                  fullWidth
                  slotProps={{ htmlInput: { inputMode: 'decimal' } }}
                  helperText="În unitatea culturii (implicit tone)"
                />
                <TextField
                  label="Randament estimat / ha"
                  value={expectedYield}
                  onChange={(event) => setExpectedYield(event.target.value)}
                  size="small"
                  fullWidth
                  slotProps={{ htmlInput: { inputMode: 'decimal' } }}
                />
              </Stack>
            </>
          ) : (
            <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
              Data semănatului, randamentul estimat și producția se completează mai târziu, din
              „Editează”. Recolta se înregistrează la închiderea culturii.
            </Typography>
          )}
          <TextField
            label="Observații"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            size="small"
            fullWidth
            multiline
            minRows={2}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={pending}>
          Renunță
        </Button>
        <Button variant="contained" onClick={submit} disabled={pending}>
          {pending ? 'Se salvează...' : 'Salvează'}
        </Button>
      </DialogActions>
    </>
  )
}

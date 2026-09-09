import { useMemo, useState } from 'react'
import { AddOutlined, DeleteOutlined, EditOutlined, Inventory2Outlined } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Card,
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
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import type {
  Crop,
  CropPayload,
  FieldCrop,
  FieldCropPayload,
  Season,
  SeasonPayload,
} from '../../api/crops.api'
import { ModalConfirmAction } from '../../components'
import {
  useCreateCrop,
  useCreateFieldCrop,
  useCreateSeason,
  useCrops,
  useDeleteCrop,
  useDeleteFieldCrop,
  useDeleteSeason,
  useFieldCrops,
  useRecordHarvest,
  useSeasons,
  useUpdateCrop,
  useUpdateFieldCrop,
  useUpdateSeason,
} from '../../hooks/useCrops'
import { useFields } from '../../hooks/useFields'
import { useHasPermission } from '../../hooks/usePermissions'
import { useNotificationStore } from '../../store/notification.store'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'

const dateFormat = new Intl.DateTimeFormat('ro-RO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

function formatDay(value: string | null | undefined) {
  if (!value) return '-'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : dateFormat.format(date)
}

function formatNumber(value: number | null | undefined, digits = 2) {
  if (value == null) return '-'
  return new Intl.NumberFormat('ro-RO', { maximumFractionDigits: digits }).format(value)
}

function toOptionalNumber(value: string): number | null {
  if (value.trim() === '') return null
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

type SectionProps = {
  title: string
  subtitle: string
  action?: React.ReactNode
  children: React.ReactNode
}

function Section({ title, subtitle, action, children }: SectionProps) {
  return (
    <Card sx={{ p: 2.5 }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
      >
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#0d1f17' }}>
            {title}
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>{subtitle}</Typography>
        </Box>
        {action}
      </Stack>
      {children}
    </Card>
  )
}

// ─── Season dialog ───────────────────────────────────────────────────────────

type SeasonDialogProps = {
  open: boolean
  season: Season | null
  onClose: () => void
}

function SeasonDialog({ open, season, onClose }: SeasonDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      {open && <SeasonForm season={season} onClose={onClose} />}
    </Dialog>
  )
}

function SeasonForm({ season, onClose }: { season: Season | null; onClose: () => void }) {
  const show = useNotificationStore((state) => state.show)
  const create = useCreateSeason()
  const update = useUpdateSeason()
  const currentYear = new Date().getFullYear()
  const [name, setName] = useState(season?.name ?? `Sezon ${currentYear}`)
  const [startDate, setStartDate] = useState(season?.start_date ?? `${currentYear}-01-01`)
  const [endDate, setEndDate] = useState(season?.end_date ?? `${currentYear}-12-31`)
  const [isActive, setIsActive] = useState(season?.is_active ?? true)
  const [notes, setNotes] = useState(season?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const pending = create.isPending || update.isPending

  const submit = () => {
    if (!name.trim()) {
      setError('Numele sezonului este obligatoriu.')
      return
    }
    if (!startDate || !endDate || endDate < startDate) {
      setError('Intervalul sezonului este invalid.')
      return
    }
    setError(null)
    const payload: SeasonPayload = {
      name: name.trim(),
      start_date: startDate,
      end_date: endDate,
      is_active: isActive,
      notes,
    }
    const options = {
      onSuccess: () => {
        show(season ? 'Sezonul a fost actualizat.' : 'Sezonul a fost creat.', 'success')
        onClose()
      },
      onError: (mutationError: unknown) =>
        setError(getApiErrorMessage(mutationError, 'Nu am putut salva sezonul.')),
    }
    if (season) update.mutate({ id: season.id, payload }, options)
    else create.mutate(payload, options)
  }

  return (
    <>
      <DialogTitle>{season ? 'Editează sezonul' : 'Sezon nou'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <TextField
            label="Nume"
            value={name}
            onChange={(event) => setName(event.target.value)}
            size="small"
            fullWidth
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label="Început"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Sfârșit"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
          <FormControlLabel
            control={
              <Switch checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
            }
            label="Sezon activ (implicit în rapoarte)"
          />
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

// ─── Crop dialog ─────────────────────────────────────────────────────────────

type CropDialogProps = {
  open: boolean
  crop: Crop | null
  onClose: () => void
}

function CropDialog({ open, crop, onClose }: CropDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      {open && <CropForm crop={crop} onClose={onClose} />}
    </Dialog>
  )
}

function CropForm({ crop, onClose }: { crop: Crop | null; onClose: () => void }) {
  const show = useNotificationStore((state) => state.show)
  const create = useCreateCrop()
  const update = useUpdateCrop()
  const [name, setName] = useState(crop?.name ?? '')
  const [code, setCode] = useState(crop?.code ?? '')
  const [category, setCategory] = useState(crop?.category ?? '')
  const [yieldUnit, setYieldUnit] = useState(crop?.yield_unit ?? 't')
  const [notes, setNotes] = useState(crop?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const pending = create.isPending || update.isPending

  const submit = () => {
    if (!name.trim()) {
      setError('Numele culturii este obligatoriu.')
      return
    }
    setError(null)
    const payload: CropPayload = {
      name: name.trim(),
      code: code.trim() || null,
      category: category.trim(),
      yield_unit: yieldUnit.trim() || 't',
      notes,
    }
    const options = {
      onSuccess: () => {
        show(crop ? 'Cultura a fost actualizată.' : 'Cultura a fost adăugată.', 'success')
        onClose()
      },
      onError: (mutationError: unknown) =>
        setError(getApiErrorMessage(mutationError, 'Nu am putut salva cultura.')),
    }
    if (crop) update.mutate({ id: crop.id, payload }, options)
    else create.mutate(payload, options)
  }

  return (
    <>
      <DialogTitle>{crop ? 'Editează cultura' : 'Cultură nouă'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <TextField
            label="Nume"
            value={name}
            onChange={(event) => setName(event.target.value)}
            size="small"
            fullWidth
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label="Cod (opțional)"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              size="small"
              fullWidth
            />
            <TextField
              label="Categorie"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              size="small"
              fullWidth
              placeholder="cereale, oleaginoase..."
            />
            <TextField
              label="Unitate producție"
              value={yieldUnit}
              onChange={(event) => setYieldUnit(event.target.value)}
              size="small"
              sx={{ minWidth: 140 }}
            />
          </Stack>
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

// ─── Field crop dialog ───────────────────────────────────────────────────────

type FieldCropDialogProps = {
  open: boolean
  item: FieldCrop | null
  defaultSeasonId: number | null
  seasons: Season[]
  crops: Crop[]
  onClose: () => void
}

function FieldCropDialog(props: FieldCropDialogProps) {
  return (
    <Dialog open={props.open} onClose={props.onClose} fullWidth maxWidth="sm">
      {props.open && <FieldCropForm {...props} />}
    </Dialog>
  )
}

function FieldCropForm({ item, defaultSeasonId, seasons, crops, onClose }: FieldCropDialogProps) {
  const show = useNotificationStore((state) => state.show)
  const { data: fields } = useFields()
  const create = useCreateFieldCrop()
  const update = useUpdateFieldCrop()
  const [fieldId, setFieldId] = useState(item?.field_id ?? '')
  const [seasonId, setSeasonId] = useState(
    String(item?.season_id ?? defaultSeasonId ?? seasons[0]?.id ?? '')
  )
  const [cropId, setCropId] = useState(String(item?.crop_id ?? crops[0]?.id ?? ''))
  const [plantedArea, setPlantedArea] = useState(
    item?.planted_area_ha != null ? String(item.planted_area_ha) : ''
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
              onChange={(event) => setFieldId(event.target.value)}
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
                  ? `Teren: ${formatNumber(selectedField.area_ha, 2)} ha (implicit toată suprafața)`
                  : undefined
              }
              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
            />
          </Stack>
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

// ─── Page ────────────────────────────────────────────────────────────────────

type DeleteTarget =
  | { kind: 'season'; item: Season }
  | { kind: 'crop'; item: Crop }
  | { kind: 'fieldCrop'; item: FieldCrop }

export default function CropsPage() {
  const show = useNotificationStore((state) => state.show)
  const canWrite = useHasPermission('crops:write')
  const { data: seasons, isPending: seasonsPending } = useSeasons()
  const { data: crops, isPending: cropsPending } = useCrops()
  const [seasonFilter, setSeasonFilter] = useState<string>('')
  const activeSeason = useMemo(
    () => (seasons ?? []).find((season) => season.is_active) ?? seasons?.[0] ?? null,
    [seasons]
  )
  const effectiveSeasonId = seasonFilter ? Number(seasonFilter) : (activeSeason?.id ?? undefined)
  const { data: fieldCrops, isPending: fieldCropsPending } = useFieldCrops(
    effectiveSeasonId ? { season_id: effectiveSeasonId } : {}
  )
  const deleteSeason = useDeleteSeason()
  const deleteCrop = useDeleteCrop()
  const deleteFieldCrop = useDeleteFieldCrop()
  const recordHarvest = useRecordHarvest()

  const handleHarvest = (item: FieldCrop) => {
    recordHarvest.mutate(item.id, {
      onSuccess: (result) => {
        if (!result.movement) {
          show('Recolta este deja înregistrată în stoc la această cantitate.', 'info')
          return
        }
        const delta = new Intl.NumberFormat('ro-RO', {
          maximumFractionDigits: 3,
          signDisplay: 'exceptZero',
        }).format(result.movement.quantity_delta)
        show(
          `Recolta a fost înregistrată în stoc (${delta} ${item.yield_unit}). Stoc curent: ${formatNumber(result.movement.resulting_quantity, 3)} ${item.yield_unit}.`,
          'success'
        )
      },
      onError: (error) =>
        show(getApiErrorMessage(error, 'Nu am putut înregistra recolta.'), 'error'),
    })
  }

  const [seasonDialog, setSeasonDialog] = useState<{ open: boolean; season: Season | null }>({
    open: false,
    season: null,
  })
  const [cropDialog, setCropDialog] = useState<{ open: boolean; crop: Crop | null }>({
    open: false,
    crop: null,
  })
  const [fieldCropDialog, setFieldCropDialog] = useState<{ open: boolean; item: FieldCrop | null }>(
    { open: false, item: null }
  )
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  const deleting = deleteSeason.isPending || deleteCrop.isPending || deleteFieldCrop.isPending

  const confirmDelete = () => {
    if (!deleteTarget) return
    const options = {
      onSuccess: () => {
        show('Înregistrarea a fost ștearsă.', 'success')
        setDeleteTarget(null)
      },
      onError: (error: unknown) => {
        show(getApiErrorMessage(error, 'Nu am putut șterge înregistrarea.'), 'error')
        setDeleteTarget(null)
      },
    }
    if (deleteTarget.kind === 'season') deleteSeason.mutate(deleteTarget.item.id, options)
    if (deleteTarget.kind === 'crop') deleteCrop.mutate(deleteTarget.item.id, options)
    if (deleteTarget.kind === 'fieldCrop') deleteFieldCrop.mutate(deleteTarget.item.id, options)
  }

  const deleteDescription = deleteTarget
    ? deleteTarget.kind === 'season'
      ? `Sezonul „${deleteTarget.item.name}” și toate culturile pe terenuri asociate vor fi șterse.`
      : deleteTarget.kind === 'crop'
        ? `Cultura „${deleteTarget.item.name}” va fi ștearsă din catalog.`
        : `Cultura „${deleteTarget.item.crop_name}” de pe terenul „${deleteTarget.item.field_name}” va fi ștearsă.`
    : ''

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', color: '#0d1f17' }}>
          Culturi
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
          Sezoane agricole, catalogul de culturi și culturile atribuite terenurilor, cu producția
          obținută.
        </Typography>
      </Box>

      <Section
        title="Sezoane"
        subtitle="Sezonul activ este folosit implicit în raportul pe culturi"
        action={
          canWrite && (
            <Button
              size="small"
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={() => setSeasonDialog({ open: true, season: null })}
            >
              Sezon nou
            </Button>
          )
        }
      >
        {seasonsPending ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (seasons ?? []).length === 0 ? (
          <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', py: 2 }}>
            Nu există sezoane. Creează primul sezon pentru a putea atribui culturi terenurilor.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nume</TableCell>
                <TableCell>Interval</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Observații</TableCell>
                {canWrite && <TableCell align="right">Acțiuni</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {(seasons ?? []).map((season) => (
                <TableRow key={season.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{season.name}</TableCell>
                  <TableCell>
                    {formatDay(season.start_date)} – {formatDay(season.end_date)}
                  </TableCell>
                  <TableCell>
                    {season.is_active ? (
                      <Chip size="small" color="success" label="Activ" />
                    ) : (
                      <Chip size="small" label="Inactiv" />
                    )}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{season.notes || '-'}</TableCell>
                  {canWrite && (
                    <TableCell align="right">
                      <Tooltip title="Editează">
                        <IconButton
                          size="small"
                          onClick={() => setSeasonDialog({ open: true, season })}
                          aria-label="Editează sezonul"
                        >
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Șterge">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteTarget({ kind: 'season', item: season })}
                          aria-label="Șterge sezonul"
                        >
                          <DeleteOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      <Section
        title="Culturi pe terenuri"
        subtitle="Ce cultură este pe fiecare teren în sezon, cu producția și randamentul obținut"
        action={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <TextField
              select
              size="small"
              label="Sezon"
              value={seasonFilter || (activeSeason ? String(activeSeason.id) : '')}
              onChange={(event) => setSeasonFilter(event.target.value)}
              sx={{ minWidth: 180 }}
              disabled={(seasons ?? []).length === 0}
            >
              {(seasons ?? []).map((season) => (
                <MenuItem key={season.id} value={String(season.id)}>
                  {season.name}
                </MenuItem>
              ))}
            </TextField>
            {canWrite && (
              <Button
                size="small"
                variant="contained"
                startIcon={<AddOutlined />}
                disabled={(seasons ?? []).length === 0 || (crops ?? []).length === 0}
                onClick={() => setFieldCropDialog({ open: true, item: null })}
              >
                Atribuie cultură
              </Button>
            )}
          </Stack>
        }
      >
        {fieldCropsPending ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (fieldCrops ?? []).length === 0 ? (
          <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', py: 2 }}>
            Nu există culturi atribuite în sezonul selectat.
          </Typography>
        ) : (
          <Box sx={{ overflow: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Teren</TableCell>
                  <TableCell>Cultură</TableCell>
                  <TableCell align="right">Suprafață (ha)</TableCell>
                  <TableCell>Semănat</TableCell>
                  <TableCell>Recoltat</TableCell>
                  <TableCell align="right">Producție</TableCell>
                  <TableCell align="right">Randament</TableCell>
                  <TableCell align="right">Estimat</TableCell>
                  <TableCell>Recoltă în stoc</TableCell>
                  {canWrite && <TableCell align="right">Acțiuni</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {(fieldCrops ?? []).map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{item.field_name}</TableCell>
                    <TableCell>{item.crop_name}</TableCell>
                    <TableCell align="right">{formatNumber(item.planted_area_ha, 2)}</TableCell>
                    <TableCell>{formatDay(item.planted_at)}</TableCell>
                    <TableCell>{formatDay(item.harvested_at)}</TableCell>
                    <TableCell align="right">
                      {item.production_total == null
                        ? '-'
                        : `${formatNumber(item.production_total, 2)} ${item.yield_unit}`}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {item.yield_per_ha == null
                        ? '-'
                        : `${formatNumber(item.yield_per_ha, 2)} ${item.yield_unit}/ha`}
                    </TableCell>
                    <TableCell align="right">
                      {item.expected_yield_per_ha == null
                        ? '-'
                        : `${formatNumber(item.expected_yield_per_ha, 2)} ${item.yield_unit}/ha`}
                    </TableCell>
                    <TableCell>
                      {item.harvest_recorded_quantity != null ? (
                        <Chip
                          size="small"
                          color={
                            item.production_total != null &&
                            item.production_total !== item.harvest_recorded_quantity
                              ? 'warning'
                              : 'success'
                          }
                          label={`${formatNumber(item.harvest_recorded_quantity, 2)} ${item.yield_unit} în stoc`}
                        />
                      ) : (
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                          neînregistrată
                        </Typography>
                      )}
                    </TableCell>
                    {canWrite && (
                      <TableCell align="right">
                        <Tooltip
                          title={
                            item.production_total && item.production_total > 0
                              ? 'Înregistrează recolta în stoc'
                              : 'Introdu mai întâi producția obținută'
                          }
                        >
                          <span>
                            <IconButton
                              size="small"
                              color="primary"
                              disabled={
                                !item.production_total ||
                                item.production_total <= 0 ||
                                recordHarvest.isPending
                              }
                              onClick={() => handleHarvest(item)}
                              aria-label="Înregistrează recolta în stoc"
                            >
                              <Inventory2Outlined fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Editează">
                          <IconButton
                            size="small"
                            onClick={() => setFieldCropDialog({ open: true, item })}
                            aria-label="Editează"
                          >
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Șterge">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteTarget({ kind: 'fieldCrop', item })}
                            aria-label="Șterge"
                          >
                            <DeleteOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Section>

      <Section
        title="Catalog de culturi"
        subtitle="Culturile disponibile pentru atribuire pe terenuri"
        action={
          canWrite && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddOutlined />}
              onClick={() => setCropDialog({ open: true, crop: null })}
            >
              Cultură nouă
            </Button>
          )
        }
      >
        {cropsPending ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nume</TableCell>
                <TableCell>Cod</TableCell>
                <TableCell>Categorie</TableCell>
                <TableCell>Unitate</TableCell>
                {canWrite && <TableCell align="right">Acțiuni</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {(crops ?? []).map((crop) => (
                <TableRow key={crop.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{crop.name}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{crop.code ?? '-'}</TableCell>
                  <TableCell>{crop.category || '-'}</TableCell>
                  <TableCell>{crop.yield_unit}</TableCell>
                  {canWrite && (
                    <TableCell align="right">
                      <Tooltip title="Editează">
                        <IconButton
                          size="small"
                          onClick={() => setCropDialog({ open: true, crop })}
                          aria-label="Editează cultura"
                        >
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Șterge">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteTarget({ kind: 'crop', item: crop })}
                          aria-label="Șterge cultura"
                        >
                          <DeleteOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      <SeasonDialog
        open={seasonDialog.open}
        season={seasonDialog.season}
        onClose={() => setSeasonDialog({ open: false, season: null })}
      />
      <CropDialog
        open={cropDialog.open}
        crop={cropDialog.crop}
        onClose={() => setCropDialog({ open: false, crop: null })}
      />
      <FieldCropDialog
        open={fieldCropDialog.open}
        item={fieldCropDialog.item}
        defaultSeasonId={effectiveSeasonId ?? null}
        seasons={seasons ?? []}
        crops={crops ?? []}
        onClose={() => setFieldCropDialog({ open: false, item: null })}
      />
      <ModalConfirmAction
        open={Boolean(deleteTarget)}
        title="Confirmă ștergerea"
        description={deleteDescription}
        confirmText="Șterge"
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </Stack>
  )
}

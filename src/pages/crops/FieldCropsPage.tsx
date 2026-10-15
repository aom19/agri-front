import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AddOutlined,
  DeleteOutlined,
  EditOutlined,
  Inventory2Outlined,
  LockOpenOutlined,
  LockOutlined,
} from '@mui/icons-material'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
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
import type { FieldCrop } from '../../api/crops.api'
import { ModalConfirmAction } from '../../components'
import {
  useCrops,
  useDeleteFieldCrop,
  useFieldCrops,
  useRecordHarvest,
  useReopenFieldCrop,
  useSeasons,
} from '../../hooks/useCrops'
import { useHasPermission } from '../../hooks/usePermissions'
import { useNotificationStore } from '../../store/notification.store'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import { formatIsoDay } from '../../utils/dateFormat'
import CloseFieldCropDialog from './components/CloseFieldCropDialog'
import FieldCropDialog from './components/FieldCropDialog'
import FieldCropStatusChip from './components/FieldCropStatusChip'
import Section from './components/Section'
import { formatNumber } from './components/cropFormat'

/**
 * Culturile pe terenuri: ce crește pe fiecare teren, în ce stare, cu producția și recolta.
 * Pe un teren e cel mult o cultură deschisă; lucrările noi merg la ea. Sezoanele și catalogul au
 * paginile lor (Configurare → Nomenclatoare).
 */
export default function FieldCropsPage() {
  const navigate = useNavigate()
  const show = useNotificationStore((state) => state.show)
  const canWrite = useHasPermission('crops:write')
  const { data: seasons } = useSeasons()
  const { data: crops } = useCrops()
  // sezonul filtrat vine din URL (?season_id=), ca pagina Sezoane să poată deschide direct un sezon
  const [searchParams, setSearchParams] = useSearchParams()
  const seasonFilter = searchParams.get('season_id') ?? ''
  const setSeasonFilter = (value: string) =>
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        if (value) next.set('season_id', value)
        else next.delete('season_id')
        return next
      },
      { replace: true }
    )
  const activeSeason = useMemo(
    () => (seasons ?? []).find((season) => season.is_active) ?? seasons?.[0] ?? null,
    [seasons]
  )
  const effectiveSeasonId = seasonFilter ? Number(seasonFilter) : (activeSeason?.id ?? undefined)
  const { data: fieldCrops, isPending: fieldCropsPending } = useFieldCrops(
    effectiveSeasonId ? { season_id: effectiveSeasonId } : {}
  )
  const deleteFieldCrop = useDeleteFieldCrop()
  const recordHarvest = useRecordHarvest()
  const reopenFieldCrop = useReopenFieldCrop()
  const [closeTarget, setCloseTarget] = useState<FieldCrop | null>(null)
  const [fieldCropDialog, setFieldCropDialog] = useState<{ open: boolean; item: FieldCrop | null }>(
    { open: false, item: null }
  )
  const [deleteTarget, setDeleteTarget] = useState<FieldCrop | null>(null)
  const missingSetup = (seasons ?? []).length === 0 || (crops ?? []).length === 0

  const handleReopen = (item: FieldCrop) => {
    reopenFieldCrop.mutate(item.id, {
      onSuccess: () => show('Cultura a fost redeschisă.', 'success'),
      onError: (error) =>
        show(getApiErrorMessage(error, 'Nu am putut redeschide cultura.'), 'error'),
    })
  }

  // Înregistrarea mută în stoc doar diferența față de ce e deja înregistrat: fără producție sau
  // cu recolta deja în stoc la cantitatea curentă nu mai e nimic de înregistrat.
  const harvestAlreadyRecorded = (item: FieldCrop) =>
    item.harvest_recorded_quantity != null &&
    item.harvest_recorded_quantity === item.production_total
  const canRecordHarvest = (item: FieldCrop) =>
    !!item.production_total && item.production_total > 0 && !harvestAlreadyRecorded(item)
  const harvestTooltip = (item: FieldCrop) => {
    if (!item.production_total || item.production_total <= 0) {
      return 'Introdu mai întâi producția obținută'
    }
    if (harvestAlreadyRecorded(item)) {
      return 'Recolta este deja înregistrată în stoc la această cantitate'
    }
    return item.harvest_recorded_quantity != null
      ? 'Înregistrează în stoc diferența față de cantitatea deja înregistrată'
      : 'Înregistrează recolta în stoc'
  }

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

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteFieldCrop.mutate(deleteTarget.id, {
      onSuccess: () => {
        show('Cultura pe teren a fost ștearsă.', 'success')
        setDeleteTarget(null)
      },
      onError: (error: unknown) => {
        show(getApiErrorMessage(error, 'Nu am putut șterge înregistrarea.'), 'error')
        setDeleteTarget(null)
      },
    })
  }

  return (
    <Stack spacing={2.5}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' } }}
      >
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', color: '#0d1f17' }}>
            Culturi
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
            Ce crește pe fiecare teren, cu producția și recolta obținută.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="text" onClick={() => navigate('/seasons')}>
            Sezoane
          </Button>
          <Button size="small" variant="text" onClick={() => navigate('/crop-catalog')}>
            Catalog de culturi
          </Button>
        </Stack>
      </Stack>

      {missingSetup && (
        <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
          Ca să atribui o cultură unui teren ai nevoie de cel puțin un sezon și o cultură în
          catalog.
        </Typography>
      )}

      <Section
        title="Culturi pe terenuri"
        subtitle="Pe un teren e cel mult o cultură deschisă; lucrările noi merg la ea. Când termini cultura, o închizi"
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
                  <TableCell>Stare</TableCell>
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
                  <TableRow
                    key={item.id}
                    hover
                    sx={
                      item.status !== 'open' ? { '& td': { color: 'text.secondary' } } : undefined
                    }
                  >
                    <TableCell sx={{ fontWeight: 600 }}>{item.field_name}</TableCell>
                    <TableCell>{item.crop_name}</TableCell>
                    <TableCell>
                      <FieldCropStatusChip item={item} />
                    </TableCell>
                    <TableCell align="right">{formatNumber(item.planted_area_ha, 2)}</TableCell>
                    <TableCell>{formatIsoDay(item.planted_at)}</TableCell>
                    <TableCell>{formatIsoDay(item.harvested_at)}</TableCell>
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
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        {item.status === 'open' ? (
                          <Tooltip title="Închide cultura (recoltată sau compromisă)">
                            <IconButton
                              size="small"
                              onClick={() => setCloseTarget(item)}
                              aria-label="Închide cultura"
                            >
                              <LockOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Redeschide cultura">
                            <span>
                              <IconButton
                                size="small"
                                disabled={reopenFieldCrop.isPending}
                                onClick={() => handleReopen(item)}
                                aria-label="Redeschide cultura"
                              >
                                <LockOpenOutlined fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                        <Tooltip title={harvestTooltip(item)}>
                          <span>
                            <IconButton
                              size="small"
                              color="primary"
                              disabled={!canRecordHarvest(item) || recordHarvest.isPending}
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
                            onClick={() => setDeleteTarget(item)}
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

      <FieldCropDialog
        open={fieldCropDialog.open}
        item={fieldCropDialog.item}
        defaultSeasonId={effectiveSeasonId ?? null}
        seasons={seasons ?? []}
        crops={crops ?? []}
        onClose={() => setFieldCropDialog({ open: false, item: null })}
      />
      <CloseFieldCropDialog item={closeTarget} onClose={() => setCloseTarget(null)} />
      <ModalConfirmAction
        open={Boolean(deleteTarget)}
        title="Confirmă ștergerea"
        description={
          deleteTarget
            ? `Cultura „${deleteTarget.crop_name}” de pe terenul „${deleteTarget.field_name}” va fi ștearsă.`
            : ''
        }
        confirmText="Șterge"
        loading={deleteFieldCrop.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </Stack>
  )
}

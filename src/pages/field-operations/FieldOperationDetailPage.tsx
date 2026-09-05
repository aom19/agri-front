import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AgricultureOutlined,
  ArrowBackOutlined,
  BuildOutlined,
  CheckCircleOutlineOutlined,
  CloseOutlined,
  EditOutlined,
  EngineeringOutlined,
  EventOutlined,
  Inventory2Outlined,
  NotesOutlined,
  PlayArrowOutlined,
  PrecisionManufacturingOutlined,
  RouteOutlined,
  TaskAltOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material'
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet'
import type {
  FieldOperation,
  FieldOperationChecklistPayload,
  FieldOperationStatus,
} from '../../api/fieldOperation.api'
import type { GeoJSONPolygon } from '../../api/fields.api'
import {
  useFieldOperation,
  useStartFieldOperation,
  useUpdateFieldOperationChecklist,
} from '../../hooks/useFieldOperations'
import { useHasPermission } from '../../hooks/usePermissions'
import { useNotificationStore } from '../../store/notification.store'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import { FieldMapModal } from '../fields/components'
import CompleteOperationDialog from './components/CompleteOperationDialog'

const DEFAULT_CENTER: LatLngTuple = [46.2297953, 28.3231304]

function formatMinutes(minutes: number | null | undefined) {
  if (minutes == null || minutes <= 0) return '-'
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} min`
  if (rest === 0) return `${hours} h`
  return `${hours} h ${rest} min`
}

function formatMetric(value: number | null | undefined, suffix: string, digits = 2) {
  if (value == null) return '-'
  return `${new Intl.NumberFormat('ro-RO', { maximumFractionDigits: digits }).format(value)} ${suffix}`
}

const statusLabels: Record<FieldOperationStatus, string> = {
  planned: 'Planificată',
  in_progress: 'În lucru',
  completed: 'Finalizată',
  canceled: 'Anulată',
}

const checklistItems: { key: keyof FieldOperationChecklistPayload; label: string }[] = [
  { key: 'machine_status', label: 'Verifică starea mașinii' },
  { key: 'implement_status', label: 'Verifică starea echipamentului' },
  { key: 'field_area', label: 'Verifică terenul și suprafața' },
  { key: 'notes_confirmed', label: 'Confirmă instrucțiunile din note' },
]

function statusTone(status: FieldOperationStatus) {
  if (status === 'in_progress') return { color: '#92400e', bg: '#fef3c7' }
  if (status === 'completed') return { color: '#166534', bg: '#dcfce7' }
  if (status === 'canceled') return { color: '#475569', bg: '#e2e8f0' }
  return { color: '#075985', bg: '#e0f2fe' }
}

function assetStatusLabel(status: string | null | undefined) {
  if (status === 'active') return 'Activ'
  if (status === 'maintenance') return 'În mentenanță'
  if (status === 'inactive') return 'Inactiv'
  return 'Necunoscut'
}

function assetStatusTone(status: string | null | undefined) {
  if (status === 'maintenance') return { color: '#92400e', bg: '#fef3c7', border: '#f59e0b' }
  if (status === 'inactive') return { color: '#991b1b', bg: '#fee2e2', border: '#ef4444' }
  return { color: '#475569', bg: '#e2e8f0', border: '#94a3b8' }
}

type ResourceIssue = {
  resource: string
  status: string
  statusLabel: string
}

function getResourceIssue(
  resource: string,
  status: string | null | undefined
): ResourceIssue | null {
  if (!status || status === 'active') return null
  return { resource, status, statusLabel: assetStatusLabel(status) }
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Neplanificat'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Neplanificat'
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatShortTime(value: string | null | undefined) {
  if (!value) return '--:--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--:--'
  return new Intl.DateTimeFormat('ro-RO', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatDuration(
  startValue: string | null | undefined,
  endValue: string | null | undefined
) {
  if (!startValue || !endValue) return '-'
  const start = new Date(startValue)
  const end = new Date(endValue)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '-'

  const minutesTotal = Math.round((end.getTime() - start.getTime()) / 60000)
  if (minutesTotal <= 0) return '-'

  const hours = Math.floor(minutesTotal / 60)
  const minutes = minutesTotal % 60
  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours} h`
  return `${hours} h ${minutes} min`
}

function getProgress(operation: FieldOperation | undefined) {
  if (!operation?.planned_start_at || !operation.planned_end_at) return 0
  const start = new Date(operation.planned_start_at).getTime()
  const end = new Date(operation.planned_end_at).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0
  return Math.min(100, Math.max(0, Math.round(((Date.now() - start) / (end - start)) * 100)))
}

function polygonCenter(points: LatLngTuple[]): LatLngTuple {
  if (points.length === 0) return DEFAULT_CENTER

  const total = points.reduce(
    (accumulator, point) => {
      accumulator.lat += point[0]
      accumulator.lng += point[1]
      return accumulator
    },
    { lat: 0, lng: 0 }
  )

  return [total.lat / points.length, total.lng / points.length]
}

function geoJSONToPoints(geometry: GeoJSONPolygon): LatLngTuple[] {
  const outerRing = geometry.coordinates[0] ?? []
  if (outerRing.length === 0) return []

  const withoutClosure = [...outerRing]
  if (outerRing.length > 1) {
    const first = outerRing[0]
    const last = outerRing[outerRing.length - 1]
    if (first[0] === last[0] && first[1] === last[1]) {
      withoutClosure.pop()
    }
  }

  return withoutClosure.map((coordinate) => [coordinate[1], coordinate[0]])
}

function getMapBounds(points: LatLngTuple[]): LatLngBoundsExpression | null {
  if (points.length === 0) return null

  const latitudes = points.map((point) => point[0])
  const longitudes = points.map((point) => point[1])

  return [
    [Math.min(...latitudes), Math.min(...longitudes)],
    [Math.max(...latitudes), Math.max(...longitudes)],
  ]
}

type ResourceDialogData = {
  label: string
  title: string
  details: { label: string; value: string }[]
}

function InfoTile({
  icon,
  label,
  value,
  issue,
  onClick,
}: {
  icon: React.ElementType
  label: string
  value: string
  issue?: ResourceIssue | null
  onClick?: () => void
}) {
  const Icon = icon
  const issueTone = issue ? assetStatusTone(issue.status) : null
  return (
    <Paper
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick()
        }
      }}
      sx={{
        p: 2,
        borderRadius: '18px',
        border: '1px solid rgba(24,63,45,0.08)',
        boxShadow: 'none',
        bgcolor: '#ffffff',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 160ms ease, border-color 160ms ease, background-color 160ms ease',
        '&:hover': onClick
          ? {
              transform: 'translateY(-2px)',
              borderColor: 'rgba(26,92,56,0.24)',
              bgcolor: '#fbfdfb',
            }
          : undefined,
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '12px',
            bgcolor: '#eef7f1',
            color: '#1a5c38',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon sx={{ fontSize: 20 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>{label}</Typography>
          <Typography sx={{ fontWeight: 800, color: '#0d1f17' }} noWrap>
            {value}
          </Typography>
          {issue && issueTone && (
            <Chip
              size="small"
              label={issue.statusLabel}
              sx={{
                mt: 0.75,
                height: 22,
                bgcolor: issueTone.bg,
                color: issueTone.color,
                border: `1px solid ${issueTone.border}`,
                fontWeight: 800,
              }}
            />
          )}
        </Box>
      </Stack>
    </Paper>
  )
}

export default function FieldOperationDetailPage() {
  const params = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { show } = useNotificationStore()
  const canWrite = useHasPermission('field_operations:write')
  const canComplete = useHasPermission('field_operations:complete')
  const id = params.id ? Number(params.id) : null
  const { data: operation, isPending, isError } = useFieldOperation(Number.isFinite(id) ? id : null)
  const updateChecklist = useUpdateFieldOperationChecklist()
  const startOperation = useStartFieldOperation()
  const [selectedResource, setSelectedResource] = useState<ResourceDialogData | null>(null)
  const [fieldMapOpen, setFieldMapOpen] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)

  const progress = getProgress(operation)
  const tone = statusTone(operation?.status ?? 'planned')
  const checklistState: FieldOperationChecklistPayload = {
    machine_status: operation?.checklist?.machine_status ?? false,
    implement_status: operation?.checklist?.implement_status ?? false,
    field_area: operation?.checklist?.field_area ?? false,
    notes_confirmed: operation?.checklist?.notes_confirmed ?? false,
  }
  const completedChecklistItems = checklistItems.filter((item) => checklistState[item.key]).length
  const checklistProgress = Math.round((completedChecklistItems / checklistItems.length) * 100)
  const checklistComplete = completedChecklistItems === checklistItems.length
  const fieldGeometry = operation?.field_geometry
  const operationFieldPoints = useMemo(
    () => (fieldGeometry ? geoJSONToPoints(fieldGeometry) : []),
    [fieldGeometry]
  )
  const operationMapFields = useMemo(
    () =>
      operation && operationFieldPoints.length > 0
        ? [
            {
              id: operation.field_id,
              name: operation.field_name,
              points: operationFieldPoints,
              center: polygonCenter(operationFieldPoints),
            },
          ]
        : [],
    [operation, operationFieldPoints]
  )
  const operationMapBounds = useMemo(
    () => getMapBounds(operationFieldPoints),
    [operationFieldPoints]
  )
  const machineIssue = getResourceIssue('Mașină', operation?.machine_status)
  const implementIssue = getResourceIssue('Echipament', operation?.implement_status)
  const resourceIssues = [machineIssue, implementIssue].filter((issue): issue is ResourceIssue =>
    Boolean(issue)
  )
  const startBlocked = resourceIssues.length > 0
  const operationStarted = operation?.status === 'in_progress'

  const toggleChecklistItem = (key: keyof FieldOperationChecklistPayload) => {
    if (!operation) return

    const next = { ...checklistState, [key]: !checklistState[key] }
    updateChecklist.mutate(
      { id: operation.id, payload: next },
      {
        onError: (error) => {
          show(getApiErrorMessage(error, 'Nu am putut salva checklistul.'), 'error')
        },
      }
    )
  }

  const openResourceDialog = (resource: ResourceDialogData) => {
    setSelectedResource(resource)
  }

  const startFieldOperation = () => {
    if (!operation) return

    startOperation.mutate(operation.id, {
      onSuccess: () => show('Lucrarea a fost pornită.', 'success'),
      onError: (error) => show(getApiErrorMessage(error, 'Nu am putut porni lucrarea.'), 'error'),
    })
  }

  if (isPending) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={30} />
      </Box>
    )
  }

  if (isError || !operation) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Button startIcon={<ArrowBackOutlined />} onClick={() => navigate('/field-operations')}>
          Înapoi
        </Button>
        <Paper sx={{ mt: 2, p: 3, textAlign: 'center' }}>
          Operațiunea nu a fost găsită sau nu ai acces la ea.
        </Paper>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        mx: { xs: -2, md: -3 },
        my: { xs: -2, md: -3 },
        minHeight: 'calc(100vh - 112px)',
        p: { xs: 2, md: 3 },
        background: 'linear-gradient(135deg, #f3f7f0 0%, #eef4eb 45%, #fbf4e4 100%)',
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
        <Button startIcon={<ArrowBackOutlined />} onClick={() => navigate('/field-operations')}>
          Înapoi la lucrări
        </Button>
        {canWrite && (
          <Button
            variant="outlined"
            startIcon={<EditOutlined />}
            onClick={() => navigate(`/field-operations/${operation.id}/edit`)}
          >
            Editează
          </Button>
        )}
      </Stack>

      <Paper
        sx={{
          p: { xs: 2.5, md: 4 },
          borderRadius: '28px',
          overflow: 'hidden',
          position: 'relative',
          bgcolor: '#123524',
          color: '#ffffff',
          boxShadow: '0 24px 60px rgba(16,42,29,0.18)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.22,
            backgroundImage:
              'url(https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <Stack sx={{ position: 'relative', zIndex: 1 }} spacing={3}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' } }}
          >
            <Box>
              <Chip
                label={statusLabels[operation.status]}
                sx={{ bgcolor: tone.bg, color: tone.color, fontWeight: 800, mb: 1.5 }}
              />
              <Typography
                sx={{ fontWeight: 900, fontSize: { xs: '2rem', md: '3.2rem' }, lineHeight: 1.05 }}
              >
                {operation.field_name}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.86)', mt: 1, fontSize: '1.05rem' }}>
                {operation.operation_type_name} · {formatDate(operation.planned_start_at)}
              </Typography>
            </Box>
            <Paper
              sx={{ p: 2, borderRadius: '20px', minWidth: 210, bgcolor: 'rgba(255,255,255,0.94)' }}
            >
              <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                Timp estimat
              </Typography>
              <Typography sx={{ color: '#123524', fontWeight: 900, fontSize: '1.7rem' }}>
                {formatDuration(operation.planned_start_at, operation.planned_end_at)}
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                {formatShortTime(operation.planned_start_at)} -{' '}
                {formatShortTime(operation.planned_end_at)}
              </Typography>
            </Paper>
          </Stack>

          <Box>
            <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.75 }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.78)', fontSize: '0.82rem' }}>
                Progres interval planificat
              </Typography>
              <Typography sx={{ fontWeight: 900 }}>{progress}%</Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 9,
                borderRadius: 5,
                bgcolor: 'rgba(255,255,255,0.22)',
                '& .MuiLinearProgress-bar': { bgcolor: '#b9f6ca', borderRadius: 5 },
              }}
            />
          </Box>
        </Stack>
      </Paper>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} sx={{ mt: 2.5 }}>
        <Box sx={{ flex: 1.2 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
              gap: 1.5,
              mb: 2.5,
            }}
          >
            <InfoTile
              icon={AgricultureOutlined}
              label="Teren"
              value={operation.field_name}
              onClick={() => setFieldMapOpen(true)}
            />
            <InfoTile
              icon={BuildOutlined}
              label="Lucrare"
              value={operation.operation_type_name}
              onClick={() =>
                openResourceDialog({
                  label: 'Tip lucrare',
                  title: operation.operation_type_name,
                  details: [
                    { label: 'Cod', value: operation.operation_type_code },
                    {
                      label: 'Template',
                      value: operation.operation_template_name ?? 'Fără template',
                    },
                  ],
                })
              }
            />
            <InfoTile
              icon={EngineeringOutlined}
              label="Operator"
              value={operation.operator_name ?? 'Neatribuit'}
              onClick={
                operation.operator_id && operation.operator_name
                  ? () =>
                      openResourceDialog({
                        label: 'Operator',
                        title: operation.operator_name ?? 'Operator',
                        details: [
                          { label: 'Lucrare curentă', value: operation.operation_type_name },
                          { label: 'Status lucrare', value: statusLabels[operation.status] },
                        ],
                      })
                  : undefined
              }
            />
            <InfoTile
              icon={PrecisionManufacturingOutlined}
              label="Mașină"
              value={operation.machine_name ?? 'Neatribuită'}
              issue={machineIssue}
              onClick={
                operation.machine_id && operation.machine_name
                  ? () =>
                      openResourceDialog({
                        label: 'Mașină',
                        title: operation.machine_name ?? 'Mașină',
                        details: [
                          ...(operation.machine_status
                            ? [
                                {
                                  label: 'Status',
                                  value: assetStatusLabel(operation.machine_status),
                                },
                              ]
                            : []),
                          {
                            label: 'Interval',
                            value: `${formatShortTime(operation.planned_start_at)} - ${formatShortTime(operation.planned_end_at)}`,
                          },
                          { label: 'Atașată lucrării', value: operation.operation_type_name },
                          ...(machineIssue
                            ? [
                                {
                                  label: 'Acțiune necesară',
                                  value: 'Schimbă mașina sau așteaptă revenirea în activ.',
                                },
                              ]
                            : []),
                        ],
                      })
                  : undefined
              }
            />
            <InfoTile
              icon={Inventory2Outlined}
              label="Echipament"
              value={operation.implement_name ?? 'Neatribuit'}
              issue={implementIssue}
              onClick={
                operation.implement_id && operation.implement_name
                  ? () =>
                      openResourceDialog({
                        label: 'Echipament',
                        title: operation.implement_name ?? 'Echipament',
                        details: [
                          ...(operation.implement_status
                            ? [
                                {
                                  label: 'Status',
                                  value: assetStatusLabel(operation.implement_status),
                                },
                              ]
                            : []),
                          {
                            label: 'Mașină asociată',
                            value: operation.machine_name ?? 'Neatribuită',
                          },
                          { label: 'Atașat lucrării', value: operation.operation_type_name },
                          ...(implementIssue
                            ? [
                                {
                                  label: 'Acțiune necesară',
                                  value: 'Schimbă echipamentul sau așteaptă revenirea în activ.',
                                },
                              ]
                            : []),
                        ],
                      })
                  : undefined
              }
            />
            <InfoTile
              icon={RouteOutlined}
              label="Suprafață"
              value={operation.area_planned_ha != null ? `${operation.area_planned_ha} ha` : '-'}
            />
          </Box>

          <Paper
            sx={{
              p: 2.5,
              borderRadius: '24px',
              boxShadow: 'none',
              border: '1px solid rgba(24,63,45,0.08)',
            }}
          >
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 1.5 }}>
              <NotesOutlined color="primary" />
              <Typography sx={{ fontWeight: 900, fontSize: '1.1rem' }}>
                Instrucțiuni și note
              </Typography>
            </Stack>
            <Typography
              sx={{ color: operation.notes ? '#173327' : 'text.secondary', lineHeight: 1.8 }}
            >
              {operation.notes || 'Nu sunt note adăugate pentru această lucrare.'}
            </Typography>
          </Paper>
        </Box>

        <Box sx={{ flex: 0.8 }}>
          <Paper
            sx={{
              p: 2.5,
              borderRadius: '24px',
              boxShadow: 'none',
              border: '1px solid rgba(24,63,45,0.08)',
              mb: 2.5,
            }}
          >
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 1.5 }}>
              <EventOutlined color="primary" />
              <Typography sx={{ fontWeight: 900, fontSize: '1.1rem' }}>
                Interval de lucru
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1.5}>
              <Box sx={{ flex: 1, p: 1.5, borderRadius: '16px', bgcolor: '#f1f8f3' }}>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>Start</Typography>
                <Typography sx={{ fontWeight: 900, fontSize: '1.25rem' }}>
                  {formatShortTime(operation.planned_start_at)}
                </Typography>
              </Box>
              <Box sx={{ flex: 1, p: 1.5, borderRadius: '16px', bgcolor: '#fff4de' }}>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                  Sfârșit
                </Typography>
                <Typography sx={{ fontWeight: 900, fontSize: '1.25rem' }}>
                  {formatShortTime(operation.planned_end_at)}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {(operation.status === 'completed' || operation.actual_start_at) && (
            <Paper sx={{ p: 2.5, borderRadius: '24px', mb: 2.5 }}>
              <Typography sx={{ fontWeight: 900, fontSize: '1.1rem', mb: 1.5 }}>
                Date reale
              </Typography>
              <Stack spacing={1}>
                {[
                  { label: 'Pornită la', value: formatDate(operation.actual_start_at) },
                  { label: 'Finalizată la', value: formatDate(operation.actual_end_at) },
                  {
                    label: 'Durată reală',
                    value: formatMinutes(operation.actual_duration_minutes),
                  },
                  {
                    label: 'Suprafață realizată',
                    value: formatMetric(operation.area_completed_ha, 'ha', 2),
                  },
                  {
                    label: 'Combustibil consumat',
                    value: formatMetric(operation.fuel_used_l, 'l', 1),
                  },
                  { label: 'Ore de mașină', value: formatMetric(operation.machine_hours, 'h', 2) },
                ].map((item) => (
                  <Stack key={item.label} direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                      {item.label}
                    </Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.9rem' }}>
                      {item.value}
                    </Typography>
                  </Stack>
                ))}
                {operation.completion_notes && (
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mt: 1 }}>
                    {operation.completion_notes}
                  </Typography>
                )}
              </Stack>
            </Paper>
          )}

          <Paper
            sx={{
              p: 2.5,
              borderRadius: '24px',
              boxShadow: 'none',
              border: '1px solid rgba(24,63,45,0.08)',
            }}
          >
            <Stack
              direction="row"
              sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
            >
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                <CheckCircleOutlineOutlined color="primary" />
                <Typography sx={{ fontWeight: 900, fontSize: '1.1rem' }}>
                  Checklist plecare
                </Typography>
              </Stack>
              <Typography sx={{ fontWeight: 900, color: '#1a5c38' }}>
                {checklistProgress}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={checklistProgress}
              sx={{
                height: 6,
                borderRadius: 3,
                mb: 1.5,
                bgcolor: '#e0e6e2',
                '& .MuiLinearProgress-bar': { bgcolor: '#1a5c38' },
              }}
            />
            {startBlocked && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  p: 1.5,
                  mb: 1.5,
                  borderRadius: '16px',
                  bgcolor: '#fff7ed',
                  border: '1px solid #fed7aa',
                  color: '#7c2d12',
                }}
              >
                <WarningAmberOutlined sx={{ fontSize: 20, mt: 0.2, flexShrink: 0 }} />
                <Box>
                  <Typography sx={{ fontWeight: 900, fontSize: '0.9rem' }}>
                    Lucrarea nu poate fi pornită.
                  </Typography>
                  {resourceIssues.map((issue) => (
                    <Typography key={issue.resource} sx={{ fontSize: '0.82rem' }}>
                      {issue.resource}: {issue.statusLabel}. Necesită modificări.
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}
            <Stack spacing={0.75}>
              {checklistItems.map((item) => (
                <Stack key={item.key} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Checkbox
                    checked={checklistState[item.key]}
                    onChange={() => toggleChecklistItem(item.key)}
                    disabled={updateChecklist.isPending}
                    size="small"
                  />
                  <Typography
                    sx={{ color: checklistState[item.key] ? 'text.secondary' : '#173327' }}
                  >
                    {item.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
            {checklistComplete && (
              <Button
                fullWidth
                variant="contained"
                startIcon={<PlayArrowOutlined />}
                disabled={operationStarted || startBlocked || startOperation.isPending}
                onClick={startFieldOperation}
                sx={{ mt: 2, borderRadius: '14px', py: 1.1, fontWeight: 900 }}
              >
                {startBlocked
                  ? 'Resurse indisponibile'
                  : operationStarted
                    ? 'Lucrare pornită'
                    : startOperation.isPending
                      ? 'Se pornește...'
                      : 'Start lucrare'}
              </Button>
            )}
            {canComplete &&
              (operation.status === 'planned' || operation.status === 'in_progress') && (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<TaskAltOutlined />}
                  onClick={() => setCompleteOpen(true)}
                  sx={{ mt: 1.5, borderRadius: '14px', py: 1.1, fontWeight: 900 }}
                >
                  Finalizează lucrarea
                </Button>
              )}
          </Paper>
        </Box>
      </Stack>

      <Dialog
        open={Boolean(selectedResource)}
        onClose={() => setSelectedResource(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle component="div" sx={{ pr: 6 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.78rem', fontWeight: 700 }}>
            {selectedResource?.label}
          </Typography>
          <Typography sx={{ fontWeight: 900, fontSize: '1.35rem' }}>
            {selectedResource?.title}
          </Typography>
          <IconButton
            aria-label="Închide"
            onClick={() => setSelectedResource(null)}
            sx={{ position: 'absolute', right: 12, top: 12 }}
          >
            <CloseOutlined />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 0, pb: 3 }}>
          <Stack spacing={1.25}>
            {selectedResource?.details.map((detail) => (
              <Box
                key={detail.label}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 2,
                  p: 1.5,
                  borderRadius: '14px',
                  bgcolor: '#f5f8f5',
                }}
              >
                <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                  {detail.label}
                </Typography>
                <Typography sx={{ fontWeight: 800, textAlign: 'right' }}>{detail.value}</Typography>
              </Box>
            ))}
          </Stack>
        </DialogContent>
      </Dialog>

      <CompleteOperationDialog
        open={completeOpen}
        operation={operation}
        onClose={() => setCompleteOpen(false)}
      />

      <FieldMapModal
        open={fieldMapOpen}
        fields={operationMapFields}
        bounds={operationMapBounds}
        title={`${operation.field_name} pe hartă`}
        description={
          operationMapFields.length > 0
            ? 'Conturul terenului asociat acestei lucrări este afișat pe hartă.'
            : 'Nu am găsit conturul terenului pentru această lucrare.'
        }
        onClose={() => setFieldMapOpen(false)}
      />
    </Box>
  )
}

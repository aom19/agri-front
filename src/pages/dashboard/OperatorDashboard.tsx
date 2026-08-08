import type { ElementType } from 'react'
import {
  AccessTimeOutlined,
  AgricultureOutlined,
  ArrowForwardOutlined,
  BuildOutlined,
  CheckCircleOutlineOutlined,
  EventAvailableOutlined,
  MapOutlined,
  PendingActionsOutlined,
  PrecisionManufacturingOutlined,
  VisibilityOutlined,
} from '@mui/icons-material'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import type { FieldOperation } from '../../api/fieldOperation.api'
import { useFieldOperations } from '../../hooks/useFieldOperations'

type OperatorDashboardProps = {
  displayName: string
  greeting: string
}

type DetailItemProps = {
  icon: ElementType
  label: string
  value: string
}

const activeStatuses = new Set(['planned', 'in_progress'])

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

function formatEstimatedWorkTime(
  startValue: string | null | undefined,
  endValue: string | null | undefined
) {
  if (!startValue || !endValue) return '-'

  const startDate = new Date(startValue)
  const endDate = new Date(endValue)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return '-'

  const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000)
  if (durationMinutes <= 0) return '-'

  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60
  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours} h`
  return `${hours} h ${minutes} min`
}

function isToday(value: string | null | undefined) {
  if (!value) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false

  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

function byPlannedStart(first: FieldOperation, second: FieldOperation) {
  const firstTime = first.planned_start_at
    ? new Date(first.planned_start_at).getTime()
    : Number.MAX_SAFE_INTEGER
  const secondTime = second.planned_start_at
    ? new Date(second.planned_start_at).getTime()
    : Number.MAX_SAFE_INTEGER
  return firstTime - secondTime
}

function statusLabel(status: FieldOperation['status']) {
  const labels: Record<FieldOperation['status'], string> = {
    planned: 'De pornit',
    in_progress: 'În lucru',
    completed: 'Finalizată',
    canceled: 'Anulată',
  }
  return labels[status]
}

function statusTone(status: FieldOperation['status']) {
  if (status === 'in_progress') return { color: '#92400e', bg: '#fef3c7' }
  if (status === 'completed') return { color: '#166534', bg: '#dcfce7' }
  if (status === 'canceled') return { color: '#475569', bg: '#e2e8f0' }
  return { color: '#075985', bg: '#e0f2fe' }
}

function getProgress(operation: FieldOperation | undefined) {
  if (!operation?.planned_start_at || !operation.planned_end_at) return 0
  const start = new Date(operation.planned_start_at).getTime()
  const end = new Date(operation.planned_end_at).getTime()
  const now = Date.now()
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0
  return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)))
}

function DetailItem({ icon, label, value }: DetailItemProps) {
  const Icon = icon
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: '10px',
          bgcolor: '#eef7f1',
          color: '#1a5c38',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 18 }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.72rem', lineHeight: 1.2 }}>
          {label}
        </Typography>
        <Typography sx={{ color: '#0d1f17', fontWeight: 700, fontSize: '0.9rem' }} noWrap>
          {value}
        </Typography>
      </Box>
    </Stack>
  )
}

export default function OperatorDashboard({ displayName, greeting }: OperatorDashboardProps) {
  const navigate = useNavigate()
  const { data: operations, isPending, isError } = useFieldOperations()
  const items = operations ?? []
  const activeOperations = items
    .filter((operation) => activeStatuses.has(operation.status))
    .sort(byPlannedStart)
  const todayOperations = activeOperations.filter((operation) =>
    isToday(operation.planned_start_at)
  )
  const inProgressOperation = activeOperations.find(
    (operation) => operation.status === 'in_progress'
  )
  const nextOperation = inProgressOperation ?? activeOperations[0]
  const nextOperations = activeOperations
    .filter((operation) => operation.id !== nextOperation?.id)
    .slice(0, 4)
  const completedToday = items.filter(
    (operation) => operation.status === 'completed' && isToday(operation.planned_start_at)
  )
  const progress = getProgress(nextOperation)
  const nextTone = statusTone(nextOperation?.status ?? 'planned')
  const operatorName = displayName.trim() || 'Operator'

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 112px)',
        mx: { xs: -2, md: -3 },
        my: { xs: -2, md: -3 },
        p: { xs: 2, md: 3 },
        color: '#173327',
        background: 'linear-gradient(135deg, #f3f7f0 0%, #eaf2ec 45%, #f7f3e8 100%)',
      }}
    >
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} sx={{ alignItems: 'stretch' }}>
        <Box
          sx={{
            flex: 1.45,
            minHeight: 420,
            borderRadius: '28px',
            overflow: 'hidden',
            position: 'relative',
            backgroundImage:
              'linear-gradient(90deg, rgba(9,35,24,0.92) 0%, rgba(9,35,24,0.62) 48%, rgba(9,35,24,0.22) 100%), url(https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: '0 24px 60px rgba(16,42,29,0.18)',
          }}
        >
          <Stack sx={{ position: 'relative', zIndex: 1, minHeight: 420, p: { xs: 2.5, md: 4 } }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              sx={{
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
              }}
            >
              <Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.74)', fontSize: '0.8rem' }}>
                  {greeting}, {operatorName}
                </Typography>
                <Typography
                  sx={{
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: { xs: '2rem', md: '3rem' },
                    lineHeight: 1.05,
                  }}
                >
                  Panoul tău de tură
                </Typography>
              </Box>
              <Chip
                label={nextOperation ? statusLabel(nextOperation.status) : 'Liber'}
                sx={{ bgcolor: nextTone.bg, color: nextTone.color, fontWeight: 800 }}
              />
            </Stack>

            <Box sx={{ flex: 1 }} />

            <Stack spacing={2.25} sx={{ maxWidth: 720 }}>
              <Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.72)', fontWeight: 700, mb: 0.75 }}>
                  Lucrarea curentă
                </Typography>
                <Typography
                  sx={{
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: { xs: '1.8rem', md: '2.7rem' },
                    lineHeight: 1.05,
                  }}
                >
                  {nextOperation ? nextOperation.field_name : 'Nu ai lucrări active'}
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.9)', mt: 1, fontSize: '1rem' }}>
                  {nextOperation
                    ? `${nextOperation.operation_type_name} · ${formatDate(nextOperation.planned_start_at)}`
                    : 'Când vei avea o operațiune planificată, detaliile apar aici.'}
                </Typography>
              </Box>

              {nextOperation && (
                <Box sx={{ maxWidth: 520 }}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.78rem' }}>
                      Progres interval
                    </Typography>
                    <Typography sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.78rem' }}>
                      {progress}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'rgba(255,255,255,0.22)',
                      '& .MuiLinearProgress-bar': { bgcolor: '#b9f6ca', borderRadius: 4 },
                    }}
                  />
                </Box>
              )}

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                {nextOperation && (
                  <Button
                    variant="contained"
                    endIcon={<ArrowForwardOutlined />}
                    onClick={() => navigate(`/field-operations/${nextOperation.id}`)}
                    sx={{ bgcolor: '#ffffff', color: '#123524', '&:hover': { bgcolor: '#e8f5ee' } }}
                  >
                    Deschide lucrarea
                  </Button>
                )}
                <Button
                  variant="outlined"
                  onClick={() => navigate('/field-operations')}
                  sx={{
                    color: '#ffffff',
                    borderColor: 'rgba(255,255,255,0.78)',
                    '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  Toate lucrările
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Box>

        <Box
          sx={{
            flex: 1,
            borderRadius: '28px',
            bgcolor: '#fffdf7',
            border: '1px solid rgba(24,63,45,0.08)',
            boxShadow: '0 18px 45px rgba(16,42,29,0.1)',
            p: { xs: 2.5, md: 3 },
          }}
        >
          <Stack spacing={2.5} sx={{ height: '100%' }}>
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: '1.25rem', color: '#173327' }}>
                Fișa lucrării
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.84rem' }}>
                Detaliile de care ai nevoie înainte să pornești pe teren.
              </Typography>
            </Box>

            {isPending ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={28} />
              </Box>
            ) : nextOperation ? (
              <>
                <Stack spacing={2}>
                  <DetailItem
                    icon={AgricultureOutlined}
                    label="Teren"
                    value={nextOperation.field_name}
                  />
                  <DetailItem
                    icon={BuildOutlined}
                    label="Lucrare"
                    value={nextOperation.operation_type_name}
                  />
                  <DetailItem
                    icon={PrecisionManufacturingOutlined}
                    label="Mașină"
                    value={nextOperation.machine_name ?? 'Neatribuită'}
                  />
                  <DetailItem
                    icon={MapOutlined}
                    label="Echipament"
                    value={nextOperation.implement_name ?? 'Neatribuit'}
                  />
                  <DetailItem
                    icon={AccessTimeOutlined}
                    label="Timp estimat"
                    value={formatEstimatedWorkTime(
                      nextOperation.planned_start_at,
                      nextOperation.planned_end_at
                    )}
                  />
                </Stack>

                <Divider />

                <Stack direction="row" spacing={1.5}>
                  <Box sx={{ flex: 1, p: 1.5, borderRadius: '16px', bgcolor: '#f1f8f3' }}>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                      Start
                    </Typography>
                    <Typography sx={{ fontWeight: 900, fontSize: '1.25rem' }}>
                      {formatShortTime(nextOperation.planned_start_at)}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, p: 1.5, borderRadius: '16px', bgcolor: '#fff4de' }}>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                      Sfârșit
                    </Typography>
                    <Typography sx={{ fontWeight: 900, fontSize: '1.25rem' }}>
                      {formatShortTime(nextOperation.planned_end_at)}
                    </Typography>
                  </Box>
                </Stack>
              </>
            ) : (
              <Box sx={{ py: 5, textAlign: 'center', color: 'text.secondary' }}>
                Nu există o lucrare activă pentru moment.
              </Box>
            )}
          </Stack>
        </Box>
      </Stack>

      {isError && (
        <Typography sx={{ color: '#b45309', fontSize: '0.85rem', mt: 2 }}>
          Nu am putut încărca lucrările operatorului. Verifică permisiunile pentru alocări și
          operațiuni pe teren.
        </Typography>
      )}

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} sx={{ mt: 2.5 }}>
        <Box
          sx={{
            flex: 1.25,
            borderRadius: '24px',
            bgcolor: 'rgba(255,255,255,0.82)',
            border: '1px solid rgba(24,63,45,0.08)',
            p: { xs: 2, md: 2.5 },
          }}
        >
          <Stack
            direction="row"
            sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: '1.1rem' }}>Agenda de azi</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
                {todayOperations.length} lucrări programate astăzi
              </Typography>
            </Box>
            <Button size="small" variant="outlined" onClick={() => navigate('/field-operations')}>
              Vezi lista
            </Button>
          </Stack>

          <Stack spacing={1.25}>
            {(todayOperations.length > 0 ? todayOperations : activeOperations.slice(0, 4)).map(
              (operation) => {
                const tone = statusTone(operation.status)
                return (
                  <Stack
                    key={operation.id}
                    direction="row"
                    spacing={1.5}
                    sx={{
                      alignItems: 'center',
                      p: 1.5,
                      borderRadius: '18px',
                      bgcolor: '#ffffff',
                      border: '1px solid rgba(24,63,45,0.08)',
                    }}
                  >
                    <Box sx={{ width: 72, flexShrink: 0 }}>
                      <Typography sx={{ fontWeight: 900, fontSize: '1.1rem' }}>
                        {formatShortTime(operation.planned_start_at)}
                      </Typography>
                      <Typography sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                        {formatEstimatedWorkTime(
                          operation.planned_start_at,
                          operation.planned_end_at
                        )}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 800 }} noWrap>
                        {operation.field_name}
                      </Typography>
                      <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem' }} noWrap>
                        {operation.operation_type_name} ·{' '}
                        {operation.machine_name ?? 'Mașină neatribuită'}
                      </Typography>
                    </Box>
                    <Chip
                      label={statusLabel(operation.status)}
                      size="small"
                      sx={{ bgcolor: tone.bg, color: tone.color, fontWeight: 800 }}
                    />
                    <Tooltip title="Vezi lucrarea">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/field-operations/${operation.id}`)}
                        aria-label="Vezi lucrarea"
                      >
                        <VisibilityOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                )
              }
            )}

            {!isPending && activeOperations.length === 0 && (
              <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                Nu ai lucrări active în agendă.
              </Box>
            )}
          </Stack>
        </Box>

        <Box
          sx={{
            flex: 0.75,
            borderRadius: '24px',
            bgcolor: '#173327',
            color: '#ffffff',
            p: { xs: 2, md: 2.5 },
          }}
        >
          <Typography sx={{ fontWeight: 900, fontSize: '1.1rem', mb: 2 }}>Sumar tură</Typography>
          <Stack spacing={1.5}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center' }}>
                <EventAvailableOutlined sx={{ color: '#b9f6ca' }} />
                <Typography>Astăzi</Typography>
              </Stack>
              <Typography sx={{ fontWeight: 900 }}>{todayOperations.length}</Typography>
            </Stack>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center' }}>
                <PendingActionsOutlined sx={{ color: '#fcd34d' }} />
                <Typography>În lucru</Typography>
              </Stack>
              <Typography sx={{ fontWeight: 900 }}>
                {items.filter((operation) => operation.status === 'in_progress').length}
              </Typography>
            </Stack>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center' }}>
                <CheckCircleOutlineOutlined sx={{ color: '#86efac' }} />
                <Typography>Finalizate azi</Typography>
              </Stack>
              <Typography sx={{ fontWeight: 900 }}>{completedToday.length}</Typography>
            </Stack>
          </Stack>

          <Divider sx={{ my: 2.5, borderColor: 'rgba(255,255,255,0.16)' }} />

          <Typography sx={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.82rem', mb: 1 }}>
            Următoarele lucrări
          </Typography>
          <Stack spacing={1}>
            {nextOperations.length > 0 ? (
              nextOperations.map((operation) => (
                <Stack
                  key={operation.id}
                  direction="row"
                  spacing={1.25}
                  sx={{ alignItems: 'center' }}
                >
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#b9f6ca' }} />
                  <Typography sx={{ flex: 1, fontSize: '0.85rem' }} noWrap>
                    {operation.field_name}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem' }}>
                    {formatShortTime(operation.planned_start_at)}
                  </Typography>
                </Stack>
              ))
            ) : (
              <Typography sx={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.85rem' }}>
                Nu sunt alte lucrări în coadă.
              </Typography>
            )}
          </Stack>
        </Box>
      </Stack>
    </Box>
  )
}

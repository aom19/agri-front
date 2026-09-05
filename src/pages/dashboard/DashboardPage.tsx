import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import {
  AgricultureOutlined,
  CheckCircleOutlined,
  PeopleOutlined,
  AssignmentOutlined,
  TrendingDown,
  TrendingFlat,
  TrendingUp,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import { useProfile } from '../../hooks/useProfile'
import {
  useDashboardActivity,
  useDashboardCards,
  useDashboardQuickStats,
  type DashboardCardKey,
} from '../../hooks/useDashboardCards'
import type { DashboardActivityItem, DashboardQuickStats } from '../../api/dashboard.api'
import OperatorDashboard from './OperatorDashboard.tsx'

const kpiConfig = [
  {
    key: 'total_machines',
    label: 'Total mașini',
    icon: AgricultureOutlined,
    iconBg: '#e8f5ee',
    iconColor: '#1a5c38',
    progressColor: '#1a5c38',
    delay: '0ms',
  },
  {
    key: 'active_machines',
    label: 'Mașini active',
    icon: CheckCircleOutlined,
    iconBg: '#d1fae5',
    iconColor: '#059669',
    progressColor: '#059669',
    delay: '100ms',
  },
  {
    key: 'total_operators',
    label: 'Total operatori',
    icon: PeopleOutlined,
    iconBg: '#e8f0ff',
    iconColor: '#1d4ed8',
    progressColor: '#1d4ed8',
    delay: '200ms',
  },
  {
    key: 'active_assignments',
    label: 'Alocări active',
    icon: AssignmentOutlined,
    iconBg: '#fef3c7',
    iconColor: '#b45309',
    progressColor: '#b45309',
    delay: '300ms',
  },
] satisfies Array<{
  key: DashboardCardKey
  label: string
  icon: typeof AgricultureOutlined
  iconBg: string
  iconColor: string
  progressColor: string
  delay: string
}>

const NEUTRAL_COLOR = '#6b7f75'

function formatTrend(value: number) {
  return value > 0 ? `+${value}` : String(value)
}

function trendVisual(value: number) {
  if (value > 0) return { icon: TrendingUp, color: '#059669', textColor: '#056849' }
  if (value < 0) return { icon: TrendingDown, color: '#dc2626', textColor: '#b91c1c' }
  return { icon: TrendingFlat, color: NEUTRAL_COLOR, textColor: '#4a5e54' }
}

// Etichete în limba română pentru intrările din jurnalul de audit afișate în „Activitate recentă”.
const entityLabels: Record<string, string> = {
  machine: 'mașină',
  implement: 'echipament',
  field: 'teren',
  field_operation: 'lucrare',
  stock: 'stoc',
  resource: 'resursă',
  resource_type: 'tip de resursă',
  operator: 'operator',
  operation_type: 'tip de operațiune',
  operation_template: 'șablon de operațiune',
  assignment: 'alocare',
  user: 'utilizator',
  season: 'sezon',
  crop: 'cultură',
  field_crop: 'cultură pe teren',
}

const actionLabels: Record<string, string> = {
  create: 'Creare',
  update: 'Actualizare',
  delete: 'Ștergere',
  activate: 'Activare',
  deactivate: 'Dezactivare',
  enable: 'Activare cont',
  disable: 'Dezactivare cont',
  start: 'Pornire',
  close: 'Închidere',
  checklist: 'Actualizare checklist',
  overdue: 'Depășire timp estimat',
  status_change: 'Schimbare status',
  complete: 'Finalizare',
  movement: 'Mișcare de stoc',
}

const statusLabels: Record<string, string> = {
  active: 'Activ',
  inactive: 'Inactiv',
  maintenance: 'Mentenanță',
  planned: 'Planificat',
  in_progress: 'În lucru',
  completed: 'Finalizat',
  cancelled: 'Anulat',
  canceled: 'Anulat',
}

const actionColors: Record<string, string> = {
  create: '#059669',
  activate: '#059669',
  enable: '#059669',
  start: '#1d4ed8',
  complete: '#008300',
  movement: '#1a5c38',
  update: '#1a5c38',
  checklist: '#1a5c38',
  close: '#4a5e54',
  deactivate: '#b45309',
  disable: '#b45309',
  overdue: '#dc2626',
  delete: '#dc2626',
}

function cleanText(value: string | null | undefined) {
  return value?.replace(/\s+/g, ' ').trim() ?? ''
}

function activityColor(action: string) {
  return actionColors[action] ?? '#4a5e54'
}

function activityText(item: DashboardActivityItem) {
  const action = actionLabels[item.action] ?? item.action
  const entity = entityLabels[item.entity_type] ?? item.entity_type
  const name = cleanText(item.entity_name) || `#${item.entity_id}`
  const base = `${action} ${entity} „${name}”`
  const oldStatus = item.old_status ? (statusLabels[item.old_status] ?? item.old_status) : null
  const status = item.status ? (statusLabels[item.status] ?? item.status) : null
  if (oldStatus && status && oldStatus !== status) return `${base} (${oldStatus} → ${status})`
  return base
}

function activityActor(item: DashboardActivityItem) {
  return cleanText(item.actor_name) || 'Sistem'
}

const relativeTimeFormat = new Intl.RelativeTimeFormat('ro-RO', { numeric: 'auto' })
const absoluteDateFormat = new Intl.DateTimeFormat('ro-RO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function formatRelativeTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000)
  const elapsed = Math.abs(diffSeconds)
  if (elapsed < 60) return 'chiar acum'
  if (elapsed < 3600) return relativeTimeFormat.format(Math.round(diffSeconds / 60), 'minute')
  if (elapsed < 86400) return relativeTimeFormat.format(Math.round(diffSeconds / 3600), 'hour')
  if (elapsed < 7 * 86400) return relativeTimeFormat.format(Math.round(diffSeconds / 86400), 'day')
  return absoluteDateFormat.format(date)
}

function buildQuickStats(stats: DashboardQuickStats | undefined, isLoading: boolean) {
  const show = (text: string) => (isLoading ? '...' : text)
  const maintenance = (stats?.maintenance_machines ?? 0) + (stats?.maintenance_implements ?? 0)
  const overdue = stats?.overdue_operations ?? 0
  const lowStocks = stats?.low_stocks ?? 0

  return [
    {
      label: 'Terenuri active',
      value: show(`${stats?.active_fields ?? 0} / ${stats?.total_fields ?? 0}`),
      color: '#059669',
    },
    {
      label: 'Lucrări în desfășurare',
      value: show(String(stats?.in_progress_operations ?? 0)),
      color: '#1a5c38',
    },
    {
      label: 'Lucrări întârziate',
      value: show(String(overdue)),
      color: overdue > 0 ? '#dc2626' : NEUTRAL_COLOR,
    },
    {
      label: 'Mentenanță necesară',
      value: show(`${maintenance} ${maintenance === 1 ? 'unitate' : 'unități'}`),
      color: maintenance > 0 ? '#b45309' : NEUTRAL_COLOR,
    },
    {
      label: 'Stocuri sub minim',
      value: show(`${lowStocks} / ${stats?.total_stocks ?? 0}`),
      color: lowStocks > 0 ? '#dc2626' : NEUTRAL_COLOR,
    },
  ]
}

type ManagerDashboardProps = {
  displayName: string
  greeting: string
}

function ManagerDashboard({ displayName, greeting }: ManagerDashboardProps) {
  const navigate = useNavigate()
  const { data: cards, isError: isCardsError, isLoading: isCardsLoading } = useDashboardCards()
  const {
    data: quickStatsData,
    isError: isQuickStatsError,
    isLoading: isQuickStatsLoading,
  } = useDashboardQuickStats()
  const {
    data: activity,
    isError: isActivityError,
    isLoading: isActivityLoading,
  } = useDashboardActivity(5)

  const cardsByKey = new Map(cards?.map((card) => [card.key, card]))
  const dashboardKpis = kpiConfig.map((config) => {
    const card = cardsByKey.get(config.key)
    const trendValue = card?.trend ?? 0

    return {
      ...config,
      label: card?.label ?? config.label,
      value: isCardsLoading ? '...' : String(card?.value ?? 0),
      progress: card?.progress ?? 0,
      trend: isCardsLoading ? '...' : formatTrend(trendValue),
      trendVisual: trendVisual(isCardsLoading ? 0 : trendValue),
    }
  })
  const activeAssignmentsText =
    dashboardKpis.find((kpi) => kpi.key === 'active_assignments')?.value ?? '0'
  const activeMachinesText =
    dashboardKpis.find((kpi) => kpi.key === 'active_machines')?.value ?? '0'
  const totalOperatorsText =
    dashboardKpis.find((kpi) => kpi.key === 'total_operators')?.value ?? '0'

  const quickStats = buildQuickStats(quickStatsData, isQuickStatsLoading)
  const activityItems = activity ?? []

  return (
    <Box
      sx={{
        '@keyframes fadeInUp': {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      {/* Greeting */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', color: '#0d1f17' }}>
          {greeting}, {displayName} 👋
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
          Iată ce se întâmplă pe câmpurile tale astăzi.
        </Typography>
      </Box>

      {/* Hero Banner */}
      <Card
        sx={{
          mb: 3,
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
          height: 180,
          backgroundImage: `url(https://images.unsplash.com/photo-1560493676-04071c5f467b?w=1400&q=80)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          animation: 'fadeInUp 0.5s ease-out',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(13,31,23,0.85) 0%, transparent 60%)',
          }}
        />
        <CardContent
          sx={{
            position: 'relative',
            zIndex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Typography sx={{ color: '#ffffff', fontWeight: 700, fontSize: '1.25rem', mb: 0.5 }}>
            {activeAssignmentsText} alocări active astăzi
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.92)', fontSize: '0.875rem', mb: 2 }}>
            Distribuite pe {activeMachinesText} mașini active și {totalOperatorsText} operatori
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate('/assignments')}
            aria-label="Vezi toate alocările active"
            sx={{
              color: '#ffffff',
              borderColor: 'rgba(255,255,255,0.85)',
              width: 'fit-content',
              fontSize: '0.75rem',
              '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255,255,255,0.1)' },
            }}
          >
            Vezi tot →
          </Button>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      {isCardsError && (
        <Typography sx={{ color: '#b45309', fontSize: '0.8rem', mb: 1.5 }}>
          Nu am putut încărca statisticile din baza de date. Reîncearcă mai târziu.
        </Typography>
      )}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {dashboardKpis.map((kpi) => {
          const KpiIcon = kpi.icon
          const TrendIcon = kpi.trendVisual.icon

          return (
            <Grid key={kpi.key} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card
                component="article"
                aria-label={`${kpi.label}: ${kpi.value}, tendință ${kpi.trend}`}
                sx={{
                  p: 2.5,
                  animation: `fadeInUp 0.5s ease-out ${kpi.delay} both`,
                }}
              >
                <Stack
                  direction="row"
                  sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
                >
                  <Box
                    aria-hidden="true"
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      bgcolor: kpi.iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <KpiIcon sx={{ fontSize: 20, color: kpi.iconColor }} />
                  </Box>
                  <Stack
                    aria-hidden="true"
                    direction="row"
                    sx={{ alignItems: 'center' }}
                    spacing={0.5}
                  >
                    <TrendIcon sx={{ fontSize: 14, color: kpi.trendVisual.color }} />
                    <Typography
                      sx={{ fontSize: '0.7rem', color: kpi.trendVisual.textColor, fontWeight: 600 }}
                    >
                      {kpi.trend}
                    </Typography>
                  </Stack>
                </Stack>
                <Box aria-hidden="true">
                  <Typography
                    sx={{ fontWeight: 700, fontSize: '2rem', color: '#0d1f17', lineHeight: 1.2 }}
                  >
                    {kpi.value}
                  </Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mb: 1.5 }}>
                    {kpi.label}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={kpi.progress}
                  aria-label={`Progres ${kpi.label}: ${kpi.progress}%`}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: '#e0e6e2',
                    '& .MuiLinearProgress-bar': { bgcolor: kpi.progressColor, borderRadius: 2 },
                  }}
                />
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {/* Bottom section */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 2.5 }}>
            <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#0d1f17', mb: 2 }}>
              Activitate recentă
            </Typography>
            {isActivityLoading ? (
              <Typography sx={{ color: 'text.secondary', fontSize: '0.825rem', py: 1 }}>
                Se încarcă activitatea...
              </Typography>
            ) : isActivityError ? (
              <Typography sx={{ color: '#b45309', fontSize: '0.825rem', py: 1 }}>
                Nu am putut încărca activitatea recentă.
              </Typography>
            ) : activityItems.length === 0 ? (
              <Typography sx={{ color: 'text.secondary', fontSize: '0.825rem', py: 1 }}>
                Nu există activitate înregistrată încă.
              </Typography>
            ) : (
              <List disablePadding>
                {activityItems.map((item, i) => {
                  const color = activityColor(item.action)

                  return (
                    <ListItem
                      key={item.id}
                      disablePadding
                      sx={{
                        py: 1,
                        borderBottom: i < activityItems.length - 1 ? '1px solid #e0e6e2' : 'none',
                      }}
                    >
                      <ListItemAvatar aria-hidden="true">
                        <Avatar sx={{ width: 32, height: 32, bgcolor: `${color}18` }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activityText(item)}
                        secondary={`${formatRelativeTime(item.created_at)} · ${activityActor(item)}`}
                        slotProps={{
                          primary: { sx: { fontSize: '0.825rem', color: '#0d1f17' } },
                          secondary: { sx: { fontSize: '0.7rem', color: 'text.secondary' } },
                        }}
                      />
                    </ListItem>
                  )
                })}
              </List>
            )}
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 2.5 }}>
            <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#0d1f17', mb: 2 }}>
              Statistici rapide
            </Typography>
            {isQuickStatsError && (
              <Typography sx={{ color: '#b45309', fontSize: '0.8rem', mb: 1.5 }}>
                Nu am putut încărca statisticile rapide.
              </Typography>
            )}
            <Stack spacing={2}>
              {quickStats.map((stat) => (
                <Stack
                  key={stat.label}
                  direction="row"
                  sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Stack direction="row" sx={{ alignItems: 'center' }} spacing={1.5}>
                    <Box
                      aria-hidden="true"
                      sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: stat.color }}
                    />
                    <Typography sx={{ fontSize: '0.825rem', color: 'text.secondary' }}>
                      {stat.label}
                    </Typography>
                  </Stack>
                  <Typography sx={{ fontSize: '0.825rem', fontWeight: 600, color: '#0d1f17' }}>
                    {stat.value}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { data: profile } = useProfile()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bună dimineața' : hour < 18 ? 'Bună ziua' : 'Bună seara'
  const displayName = profile?.first_name || user?.email?.split('@')[0] || 'User'
  const role = profile?.role_code ?? profile?.role ?? user?.role

  if (role?.toLowerCase() === 'operator') {
    return <OperatorDashboard displayName={displayName} greeting={greeting} />
  }

  return <ManagerDashboard displayName={displayName} greeting={greeting} />
}

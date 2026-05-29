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
  TrendingUp,
} from '@mui/icons-material'
import { useAuthStore } from '../../store/auth.store'

const kpis = [
  {
    label: 'Total mașini',
    value: '24',
    icon: AgricultureOutlined,
    iconBg: '#e8f5ee',
    iconColor: '#1a5c38',
    progress: 75,
    progressColor: '#1a5c38',
    trend: '+3',
    delay: '0ms',
  },
  {
    label: 'Mașini active',
    value: '18',
    icon: CheckCircleOutlined,
    iconBg: '#d1fae5',
    iconColor: '#059669',
    progress: 85,
    progressColor: '#059669',
    trend: '+2',
    delay: '100ms',
  },
  {
    label: 'Total operatori',
    value: '47',
    icon: PeopleOutlined,
    iconBg: '#e8f0ff',
    iconColor: '#1d4ed8',
    progress: 60,
    progressColor: '#1d4ed8',
    trend: '+5',
    delay: '200ms',
  },
  {
    label: 'Alocări active',
    value: '12',
    icon: AssignmentOutlined,
    iconBg: '#fef3c7',
    iconColor: '#b45309',
    progress: 45,
    progressColor: '#b45309',
    trend: '+1',
    delay: '300ms',
  },
]

const recentActivity = [
  { text: 'Tractorul John Deere 8R alocat lui Ion Popescu', time: 'acum 5 min', color: '#1a5c38' },
  { text: 'Combina a finalizat câmpul B-12', time: 'acum 23 min', color: '#059669' },
  { text: 'Operator nou Maria Ionescu înregistrat', time: 'acum 1h', color: '#1d4ed8' },
  { text: 'Mentenanță sistem irigații programată', time: 'acum 2h', color: '#b45309' },
  { text: 'Raport combustibil depus pentru secțiunea A', time: 'acum 3h', color: '#4a5e54' },
]

const quickStats = [
  { label: 'Câmpuri active', value: '12 / 18', color: '#059669' },
  { label: 'Eficiență combustibil', value: '87%', color: '#1a5c38' },
  { label: 'Sarcini întârziate', value: '2', color: '#dc2626' },
  { label: 'Mentenanță necesară', value: '4 unități', color: '#b45309' },
]

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bună dimineața' : hour < 18 ? 'Bună ziua' : 'Bună seara'

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
          {greeting}, {user?.email?.split('@')[0] || 'User'} 👋
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
            3 alocări active astăzi
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.92)', fontSize: '0.875rem', mb: 2 }}>
            Distribuite pe 5 mașini și 8 operatori
          </Typography>
          <Button
            variant="outlined"
            size="small"
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
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {kpis.map((kpi) => (
          <Grid key={kpi.label} size={{ xs: 12, sm: 6, lg: 3 }}>
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
                  <kpi.icon sx={{ fontSize: 20, color: kpi.iconColor }} />
                </Box>
                <Stack aria-hidden="true" direction="row" sx={{ alignItems: 'center' }} spacing={0.5}>
                  <TrendingUp sx={{ fontSize: 14, color: '#059669' }} />
                  <Typography sx={{ fontSize: '0.7rem', color: '#056849', fontWeight: 600 }}>
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
        ))}
      </Grid>

      {/* Bottom section */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 2.5 }}>
            <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#0d1f17', mb: 2 }}>
              Activitate recentă
            </Typography>
            <List disablePadding>
              {recentActivity.map((item, i) => (
                <ListItem
                  key={i}
                  disablePadding
                  sx={{
                    py: 1,
                    borderBottom: i < recentActivity.length - 1 ? '1px solid #e0e6e2' : 'none',
                  }}
                >
                  <ListItemAvatar aria-hidden="true">
                    <Avatar sx={{ width: 32, height: 32, bgcolor: `${item.color}18` }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={item.text}
                    secondary={item.time}
                    slotProps={{
                      primary: { sx: { fontSize: '0.825rem', color: '#0d1f17' } },
                      secondary: { sx: { fontSize: '0.7rem', color: 'text.secondary' } },
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 2.5 }}>
            <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#0d1f17', mb: 2 }}>
              Statistici rapide
            </Typography>
            <Stack spacing={2}>
              {quickStats.map((stat) => (
                <Stack
                  key={stat.label}
                  direction="row"
                  sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Stack direction="row" sx={{ alignItems: 'center' }} spacing={1.5}>
                    <Box aria-hidden="true" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: stat.color }} />
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

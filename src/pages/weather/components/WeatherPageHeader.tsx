import { Box, Stack, Typography } from '@mui/material'
import { MapOutlined } from '@mui/icons-material'
import type { CurrentWeather } from '../../../api/weather.api'
import { WeatherSummary } from './WeatherSummary'

export function WeatherPageHeader({ weather }: { weather?: CurrentWeather }) {
  return (
    <Stack
      direction={{ xs: 'column', lg: 'row' }}
      spacing={2}
      sx={{ alignItems: { xs: 'stretch', lg: 'center' }, justifyContent: 'space-between', mb: 2 }}
    >
      <Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.75 }}>
          <MapOutlined sx={{ color: '#1a5c38' }} />
          <Typography sx={{ fontSize: '1.45rem', fontWeight: 700, color: '#0d1f17' }}>
            Hartă meteo terenuri
          </Typography>
        </Stack>
        <Typography sx={{ color: 'text.secondary', maxWidth: 720 }}>
          Terenurile tale sunt afișate peste harta OpenStreetMap, cu vremea curentă pentru zona
          Cantemir și strat radar gratuit RainViewer.
        </Typography>
      </Box>

      <WeatherSummary weather={weather} />
    </Stack>
  )
}

import { Box, Stack, Typography } from '@mui/material'
import type { CurrentWeather } from '../../../api/weather.api'
import { WEATHER_ICON_SYMBOLS } from '../constants/weather.constants'
import { formatObservedAt } from '../weather.helpers'

export function WeatherSummary({ weather }: { weather?: CurrentWeather }) {
  return (
    <Box
      sx={{
        borderRadius: '8px',
        bgcolor: '#0d1f17',
        color: '#fff',
        p: 2,
        minWidth: { xs: '100%', md: 280 },
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Box sx={{ fontSize: 32, lineHeight: 1 }}>
          {weather ? WEATHER_ICON_SYMBOLS[weather.icon] : '🌤'}
        </Box>
        <Box>
          <Typography sx={{ fontSize: '0.75rem', color: '#a8bdb4' }}>Cantemir</Typography>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1.1 }}>
            {weather ? `${weather.temperature_c}°C` : 'Meteo indisponibil'}
          </Typography>
        </Box>
      </Stack>
      {weather && (
        <Stack spacing={0.75} sx={{ mt: 1.5 }}>
          <Typography sx={{ fontSize: '0.88rem' }}>{weather.condition}</Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#a8bdb4' }}>
            {weather.source} • {formatObservedAt(weather.observed_at)}
          </Typography>
        </Stack>
      )}
    </Box>
  )
}

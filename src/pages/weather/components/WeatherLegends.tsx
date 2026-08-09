import { Box, Stack, Typography } from '@mui/material'
import { RADAR_ZOOM, weatherLayerLabels } from '../constants/weather.constants'
import type { WeatherLayer } from '../types/weather.types'

export function LayerLegend({ layer }: { layer: WeatherLayer }) {
  if (layer === 'none') return null

  const ranges: Partial<Record<WeatherLayer, Array<{ color: string; label: string }>>> = {
    temperature: [
      { color: '#38bdf8', label: '< 8°C' },
      { color: '#22c55e', label: '8-17°C' },
      { color: '#f59e0b', label: '18-27°C' },
      { color: '#ef4444', label: '28°C+' },
    ],
    humidity: [
      { color: '#f59e0b', label: '< 35%' },
      { color: '#22c55e', label: '35-69%' },
      { color: '#2563eb', label: '70%+' },
    ],
    precipitation: [
      { color: '#a7f3d0', label: '0 mm' },
      { color: '#38bdf8', label: '< 1 mm' },
      { color: '#2563eb', label: '1-3.9 mm' },
      { color: '#7c3aed', label: '4 mm+' },
    ],
    wind: [{ color: '#0d1f17', label: 'săgeata arată direcția vântului' }],
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        left: 16,
        bottom: 24,
        zIndex: 1000,
        bgcolor: 'rgba(255,255,255,0.94)',
        border: '1px solid #dce5df',
        borderRadius: '8px',
        boxShadow: '0 10px 24px rgba(13,31,23,0.16)',
        px: 1.5,
        py: 1.25,
        pointerEvents: 'none',
      }}
    >
      <Typography sx={{ fontSize: '0.74rem', fontWeight: 800, mb: 0.75 }}>
        {weatherLayerLabels[layer]}
      </Typography>
      <Stack spacing={0.55}>
        {(ranges[layer] ?? []).map((item) => (
          <Stack key={item.label} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color }} />
            <Typography sx={{ fontSize: '0.7rem' }}>{item.label}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  )
}

export function RadarLegend() {
  return (
    <Box
      sx={{
        position: 'absolute',
        right: 16,
        bottom: 24,
        zIndex: 1000,
        bgcolor: 'rgba(255,255,255,0.94)',
        border: '1px solid #dce5df',
        borderRadius: '8px',
        boxShadow: '0 10px 24px rgba(13,31,23,0.16)',
        px: 1.5,
        py: 1.25,
        pointerEvents: 'none',
      }}
    >
      <Typography sx={{ fontSize: '0.74rem', fontWeight: 800 }}>Radar RainViewer</Typography>
      <Typography sx={{ fontSize: '0.7rem', mt: 0.35 }}>Zoom blocat la {RADAR_ZOOM}</Typography>
    </Box>
  )
}

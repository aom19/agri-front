import {
  Chip,
  FormControlLabel,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import { CloudOutlined, MapOutlined, RadarOutlined } from '@mui/icons-material'
import { weatherLayerLabels } from '../constants/weather.constants'
import type { WeatherLayer } from '../types/weather.types'

type WeatherControlsProps = {
  activeLayer: WeatherLayer
  fieldCount: number
  fieldWeatherCount: number
  rainViewerTileUrl: string | null
  radarEnabled: boolean
  totalArea: number
  onActiveLayerChange: (layer: WeatherLayer) => void
  onRadarEnabledChange: (enabled: boolean) => void
}

export function WeatherControls({
  activeLayer,
  fieldCount,
  fieldWeatherCount,
  rainViewerTileUrl,
  radarEnabled,
  totalArea,
  onActiveLayerChange,
  onRadarEnabledChange,
}: WeatherControlsProps) {
  return (
    <>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1}
        sx={{ alignItems: { xs: 'stretch', md: 'center' }, mb: 2 }}
      >
        <Chip icon={<MapOutlined />} label={`${fieldCount} terenuri`} />
        <Chip icon={<CloudOutlined />} label={`${totalArea.toFixed(2)} ha total`} />
        <Chip
          icon={<RadarOutlined />}
          label={`Meteo pe ${fieldWeatherCount}/${fieldCount} terenuri`}
        />
        <FormControlLabel
          control={
            <Switch
              checked={radarEnabled}
              onChange={(event) => onRadarEnabledChange(event.target.checked)}
              disabled={!rainViewerTileUrl}
            />
          }
          label="Radar precipitații"
          sx={{ ml: { xs: 0, md: 'auto' } }}
        />
      </Stack>

      <ToggleButtonGroup
        exclusive
        size="small"
        value={activeLayer}
        onChange={(_, nextLayer: WeatherLayer | null) =>
          nextLayer && onActiveLayerChange(nextLayer)
        }
        sx={{ mb: 2, flexWrap: 'wrap', gap: 0.75 }}
      >
        {(Object.keys(weatherLayerLabels) as WeatherLayer[]).map((layer) => (
          <ToggleButton
            key={layer}
            value={layer}
            sx={{ border: '1px solid #dce5df !important', borderRadius: '8px !important' }}
          >
            {weatherLayerLabels[layer]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </>
  )
}

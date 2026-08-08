import { Box, CircularProgress } from '@mui/material'
import { MapContainer, TileLayer } from 'react-leaflet'
import type { LatLngBoundsExpression } from 'leaflet'
import type { CurrentWeather } from '../../../api/weather.api'
import { DEFAULT_CENTER, RADAR_ZOOM } from '../constants/weather.constants'
import { WeatherFieldsLayer } from './WeatherFieldsLayer'
import { LayerLegend, RadarLegend } from './WeatherLegends'
import { MapBoundsSetter, RadarZoomLock } from './WeatherMapControllers'
import type { MapField, WeatherLayer } from '../types/weather.types'

type WeatherMapCanvasProps = {
  activeLayer: WeatherLayer
  bounds: LatLngBoundsExpression | null
  fieldWeatherById: Map<string, CurrentWeather>
  fields: MapField[]
  loading: boolean
  radarEnabled: boolean
  rainViewerTileUrl: string | null
}

export function WeatherMapCanvas({
  activeLayer,
  bounds,
  fieldWeatherById,
  fields,
  loading,
  radarEnabled,
  rainViewerTileUrl,
}: WeatherMapCanvasProps) {
  return (
    <Box
      sx={{
        height: { xs: '68vh', md: 'calc(100vh - 260px)' },
        minHeight: 520,
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #dce5df',
        bgcolor: '#e8efe9',
        position: 'relative',
      }}
    >
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            zIndex: 1000,
            inset: 0,
            bgcolor: 'rgba(255,255,255,0.72)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      )}
      <MapContainer center={DEFAULT_CENTER} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {radarEnabled && rainViewerTileUrl && (
          <TileLayer
            attribution='Radar &copy; <a href="https://www.rainviewer.com/">RainViewer</a>'
            url={rainViewerTileUrl}
            maxNativeZoom={RADAR_ZOOM}
            maxZoom={18}
            opacity={0.58}
            zIndex={450}
          />
        )}
        <RadarZoomLock enabled={radarEnabled} />
        <MapBoundsSetter bounds={bounds} />
        <WeatherFieldsLayer
          activeLayer={activeLayer}
          fieldWeatherById={fieldWeatherById}
          fields={fields}
          radarEnabled={radarEnabled}
        />
      </MapContainer>
      {!radarEnabled && <LayerLegend layer={activeLayer} />}
      {radarEnabled && <RadarLegend />}
    </Box>
  )
}

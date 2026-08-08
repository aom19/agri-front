import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import {
  Box,
  Chip,
  CircularProgress,
  FormControlLabel,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { CloudOutlined, MapOutlined, RadarOutlined } from '@mui/icons-material'
import {
  CircleMarker,
  Marker,
  Polygon,
  Popup,
  TileLayer,
  MapContainer,
  useMap,
} from 'react-leaflet'
import { divIcon } from 'leaflet'
import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet'
import { useFields } from '../../hooks/useFields'
import { useCurrentWeather } from '../../hooks/useWeather'
import { weatherApi } from '../../api/weather.api'
import type { Field, GeoJSONPolygon } from '../../api/fields.api'
import type { CurrentWeather, WeatherIcon } from '../../api/weather.api'

const DEFAULT_CENTER: LatLngTuple = [46.27749, 28.20052]
const FIELD_POLYGON_COLOR = '#10b981'
const FIELD_POLYGON_FILL = 'rgba(16, 185, 129, 0.22)'
const WEATHER_ICON_SYMBOLS: Record<WeatherIcon, string> = {
  sunny: '☀️',
  moon: '🌙',
  partly_cloudy: '🌤',
  cloudy: '☁️',
  rain: '🌧',
  snow: '❄️',
  showers: '🌦',
  storm: '⛈',
}

type MapField = {
  id: string
  name: string
  areaHa: number | null
  cadastralNumber?: string | null
  points: LatLngTuple[]
  center: LatLngTuple
}

type RainViewerMaps = {
  radar?: {
    past?: Array<{ path: string; time: number }>
    nowcast?: Array<{ path: string; time: number }>
  }
}

type WeatherLayer = 'none' | 'temperature' | 'humidity' | 'wind' | 'precipitation'

const weatherLayerLabels: Record<WeatherLayer, string> = {
  none: 'Terenuri',
  temperature: 'Temperatură',
  humidity: 'Umiditate',
  wind: 'Vânt',
  precipitation: 'Precipitații',
}

const RADAR_ZOOM = 7

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    }

    return entities[character]
  })
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

function getMapBounds(fields: MapField[]): LatLngBoundsExpression | null {
  const allPoints = fields.flatMap((field) => field.points)
  if (allPoints.length === 0) return null

  const latitudes = allPoints.map((point) => point[0])
  const longitudes = allPoints.map((point) => point[1])

  return [
    [Math.min(...latitudes), Math.min(...longitudes)],
    [Math.max(...latitudes), Math.max(...longitudes)],
  ]
}

function toMapFields(fields: Field[]): MapField[] {
  return fields.map((field) => {
    const points = geoJSONToPoints(field.geometry)
    return {
      id: field.id,
      name: field.name,
      areaHa: field.area_ha,
      cadastralNumber: field.cadastral_number,
      points,
      center: polygonCenter(points),
    }
  })
}

function formatObservedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Actualizat recent'

  return new Intl.DateTimeFormat('ro-RO', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  }).format(date)
}

function formatArea(area: number | null) {
  if (area == null) return 'Suprafață necalculată'
  return `${area.toFixed(2)} ha`
}

function formatMetric(value: number | undefined, unit: string) {
  if (value == null) return 'n/a'
  return `${value}${unit}`
}

function getTemperatureColor(value: number | undefined) {
  if (value == null) return '#94a3b8'
  if (value < 8) return '#38bdf8'
  if (value < 18) return '#22c55e'
  if (value < 28) return '#f59e0b'
  return '#ef4444'
}

function getHumidityColor(value: number | undefined) {
  if (value == null) return '#94a3b8'
  if (value < 35) return '#f59e0b'
  if (value < 70) return '#22c55e'
  return '#2563eb'
}

function getPrecipitationColor(value: number | undefined) {
  if (value == null) return '#94a3b8'
  if (value <= 0) return '#a7f3d0'
  if (value < 1) return '#38bdf8'
  if (value < 4) return '#2563eb'
  return '#7c3aed'
}

function getLayerColor(layer: WeatherLayer, weather: CurrentWeather) {
  if (layer === 'temperature') return getTemperatureColor(weather.temperature_c)
  if (layer === 'humidity') return getHumidityColor(weather.humidity_percent)
  if (layer === 'precipitation') return getPrecipitationColor(weather.precipitation_mm)
  return '#10b981'
}

function getLayerValue(layer: WeatherLayer, weather: CurrentWeather) {
  if (layer === 'temperature') return `${weather.temperature_c}°C`
  if (layer === 'humidity') return formatMetric(weather.humidity_percent, '%')
  if (layer === 'precipitation') return formatMetric(weather.precipitation_mm, ' mm')
  if (layer === 'wind') return formatMetric(weather.wind_speed_kmh, ' km/h')
  return ''
}

function getLayerRadius(layer: WeatherLayer, weather: CurrentWeather) {
  if (layer === 'temperature') return Math.max(22, Math.min(54, 22 + weather.temperature_c))
  if (layer === 'humidity')
    return Math.max(22, Math.min(58, 18 + (weather.humidity_percent ?? 0) / 2))
  if (layer === 'precipitation')
    return Math.max(22, Math.min(60, 24 + (weather.precipitation_mm ?? 0) * 8))
  return 28
}

function windDirectionLabel(value: number | undefined) {
  if (value == null) return 'n/a'
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SV', 'V', 'NV']
  return directions[Math.round(value / 45) % directions.length]
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
      <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary' }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.76rem', fontWeight: 700 }}>{value}</Typography>
    </Stack>
  )
}

function LayerLegend({ layer }: { layer: WeatherLayer }) {
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

function RadarLegend() {
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

function MapBoundsSetter({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap()

  useEffect(() => {
    if (!bounds) return
    if (map.getMinZoom() === RADAR_ZOOM && map.getMaxZoom() === RADAR_ZOOM) return
    map.fitBounds(bounds, { padding: [42, 42] })
  }, [bounds, map])

  return null
}

function RadarZoomLock({ enabled }: { enabled: boolean }) {
  const map = useMap()
  const originalZoomOptionsRef = useRef<{ minZoom?: number; maxZoom?: number } | null>(null)

  useEffect(() => {
    if (!originalZoomOptionsRef.current) {
      originalZoomOptionsRef.current = {
        minZoom: map.options.minZoom,
        maxZoom: map.options.maxZoom,
      }
    }

    if (enabled) {
      map.closePopup()
      map.setZoom(RADAR_ZOOM)
      map.setMinZoom(RADAR_ZOOM)
      map.setMaxZoom(RADAR_ZOOM)
      map.scrollWheelZoom.disable()
      map.doubleClickZoom.disable()
      map.touchZoom.disable()
      map.boxZoom.disable()
      map.keyboard.disable()
      return
    }

    const original = originalZoomOptionsRef.current
    map.setMinZoom(original?.minZoom ?? 0)
    map.setMaxZoom(original?.maxZoom ?? 18)
    map.scrollWheelZoom.enable()
    map.doubleClickZoom.enable()
    map.touchZoom.enable()
    map.boxZoom.enable()
    map.keyboard.enable()
  }, [enabled, map])

  return null
}

function WeatherSummary({ weather }: { weather?: CurrentWeather }) {
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

function useRainViewerLayer() {
  const [tileUrl, setTileUrl] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadLayer() {
      try {
        const response = await fetch('https://api.rainviewer.com/public/weather-maps.json', {
          signal: controller.signal,
        })
        if (!response.ok) return

        const data = (await response.json()) as RainViewerMaps
        const frame = data.radar?.nowcast?.at(-1) ?? data.radar?.past?.at(-1)
        if (!frame) return

        setTileUrl(`https://tilecache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/2/1_1.png`)
      } catch {
        if (!controller.signal.aborted) setTileUrl(null)
      }
    }

    loadLayer()

    return () => controller.abort()
  }, [])

  return tileUrl
}

export default function WeatherMapPage() {
  const { data: fields, isLoading: fieldsLoading } = useFields()
  const { data: weather, isLoading: weatherLoading } = useCurrentWeather()
  const [activeLayer, setActiveLayer] = useState<WeatherLayer>('temperature')
  const [radarEnabled, setRadarEnabled] = useState(false)
  const rainViewerTileUrl = useRainViewerLayer()

  const mapFields = useMemo(() => toMapFields(fields ?? []), [fields])
  const bounds = useMemo(() => getMapBounds(mapFields), [mapFields])
  const totalArea = useMemo(
    () => mapFields.reduce((sum, field) => sum + (field.areaHa ?? 0), 0),
    [mapFields]
  )
  const fieldWeatherResults = useQueries({
    queries: mapFields.map((field) => ({
      queryKey: ['field-weather', field.id, field.center[0].toFixed(4), field.center[1].toFixed(4)],
      queryFn: () =>
        weatherApi.getCurrent({
          lat: field.center[0],
          lng: field.center[1],
          location: field.name,
        }),
      enabled: field.points.length > 0,
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
    })),
  })
  const fieldWeatherById = useMemo(() => {
    const result = new Map<string, CurrentWeather>()

    mapFields.forEach((field, index) => {
      const fieldWeather = fieldWeatherResults[index]?.data
      if (fieldWeather) result.set(field.id, fieldWeather)
    })

    return result
  }, [fieldWeatherResults, mapFields])
  const fieldWeatherCount = fieldWeatherById.size

  const loading = fieldsLoading || weatherLoading

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, mx: 'auto', width: '100%' }}>
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

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1}
        sx={{ alignItems: { xs: 'stretch', md: 'center' }, mb: 2 }}
      >
        <Chip icon={<MapOutlined />} label={`${mapFields.length} terenuri`} />
        <Chip icon={<CloudOutlined />} label={`${totalArea.toFixed(2)} ha total`} />
        <Chip
          icon={<RadarOutlined />}
          label={`Meteo pe ${fieldWeatherCount}/${mapFields.length} terenuri`}
        />
        <FormControlLabel
          control={
            <Switch
              checked={radarEnabled}
              onChange={(event) => setRadarEnabled(event.target.checked)}
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
        onChange={(_, nextLayer: WeatherLayer | null) => nextLayer && setActiveLayer(nextLayer)}
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
          {mapFields.map((field) => {
            if (field.points.length === 0) return null
            const fieldWeather = fieldWeatherById.get(field.id)
            const labelColor = fieldWeather
              ? getLayerColor(activeLayer, fieldWeather)
              : FIELD_POLYGON_COLOR
            const layerValue = fieldWeather ? getLayerValue(activeLayer, fieldWeather) : ''

            const labelIcon = divIcon({
              className: 'weather-field-label-marker',
              html: `
                                <div style="
                                    transform: translate(-50%, -50%);
                                    background: rgba(13, 31, 23, 0.92);
                                    color: #fff;
                                    border: 2px solid ${labelColor};
                                    border-radius: 999px;
                                    padding: 6px 10px;
                                    font-size: 12px;
                                    font-weight: 700;
                                    box-shadow: 0 10px 22px rgba(13, 31, 23, 0.25);
                                    white-space: nowrap;
                                ">${escapeHtml(field.name)}${layerValue ? ` • ${escapeHtml(layerValue)}` : ''}</div>
                            `,
              iconSize: [1, 1],
              iconAnchor: [0, 0],
            })

            const windIcon = fieldWeather
              ? divIcon({
                  className: 'weather-wind-marker',
                  html: `
                                    <div style="
                                        transform: translate(-50%, -50%);
                                        width: 36px;
                                        height: 36px;
                                        border-radius: 999px;
                                        display: grid;
                                        place-items: center;
                                        background: rgba(255,255,255,0.92);
                                        border: 2px solid #0d1f17;
                                        color: #0d1f17;
                                        box-shadow: 0 8px 20px rgba(13,31,23,0.22);
                                        font-size: 22px;
                                        font-weight: 900;
                                    ">
                                        <span style="display:block; transform: rotate(${fieldWeather.wind_direction_deg ?? 0}deg);">↑</span>
                                    </div>
                                `,
                  iconSize: [1, 1],
                  iconAnchor: [0, 0],
                })
              : null

            return (
              <Box component="span" key={field.id}>
                {!radarEnabled &&
                  fieldWeather &&
                  activeLayer !== 'none' &&
                  activeLayer !== 'wind' && (
                    <CircleMarker
                      center={field.center}
                      radius={getLayerRadius(activeLayer, fieldWeather)}
                      pathOptions={{
                        color: getLayerColor(activeLayer, fieldWeather),
                        fillColor: getLayerColor(activeLayer, fieldWeather),
                        fillOpacity: 0.32,
                        opacity: 0.72,
                        weight: 2,
                      }}
                      interactive={false}
                    />
                  )}
                {!radarEnabled && fieldWeather && activeLayer === 'wind' && windIcon && (
                  <Marker position={field.center} icon={windIcon} interactive={false} />
                )}
                <Polygon
                  positions={field.points}
                  pathOptions={{
                    color: FIELD_POLYGON_COLOR,
                    fillColor: FIELD_POLYGON_FILL,
                    fillOpacity: 0.26,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <Stack spacing={0.75} sx={{ minWidth: 190 }}>
                      <Typography sx={{ fontWeight: 700 }}>{field.name}</Typography>
                      <Typography sx={{ fontSize: '0.82rem' }}>
                        {formatArea(field.areaHa)}
                      </Typography>
                      {field.cadastralNumber && (
                        <Typography sx={{ fontSize: '0.82rem' }}>
                          Cadastral: {field.cadastralNumber}
                        </Typography>
                      )}
                      <Box sx={{ pt: 0.5, borderTop: '1px solid #e0e6e2' }}>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>
                          {fieldWeather
                            ? `${WEATHER_ICON_SYMBOLS[fieldWeather.icon]} ${fieldWeather.temperature_c}°C • ${fieldWeather.condition}`
                            : 'Meteo indisponibil'}
                        </Typography>
                        {fieldWeather && (
                          <Stack spacing={0.35} sx={{ mt: 0.75 }}>
                            <MetricLine
                              label="Umiditate"
                              value={formatMetric(fieldWeather.humidity_percent, '%')}
                            />
                            <MetricLine
                              label="Vânt"
                              value={`${formatMetric(fieldWeather.wind_speed_kmh, ' km/h')} ${windDirectionLabel(fieldWeather.wind_direction_deg)}`}
                            />
                            <MetricLine
                              label="Precipitații"
                              value={formatMetric(fieldWeather.precipitation_mm, ' mm')}
                            />
                            <MetricLine
                              label="Nori"
                              value={formatMetric(fieldWeather.cloud_cover_percent, '%')}
                            />
                            <Typography
                              sx={{ fontSize: '0.72rem', color: 'text.secondary', pt: 0.25 }}
                            >
                              {fieldWeather.source} • {formatObservedAt(fieldWeather.observed_at)}
                            </Typography>
                          </Stack>
                        )}
                      </Box>
                    </Stack>
                  </Popup>
                </Polygon>
                {!radarEnabled && (
                  <Marker position={field.center} icon={labelIcon} interactive={false} />
                )}
              </Box>
            )
          })}
        </MapContainer>
        {!radarEnabled && <LayerLegend layer={activeLayer} />}
        {radarEnabled && <RadarLegend />}
      </Box>
    </Box>
  )
}

import { useMemo, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { Box } from '@mui/material'
import { useFields } from '../../hooks/useFields'
import { useCurrentWeather } from '../../hooks/useWeather'
import { weatherApi } from '../../api/weather.api'
import type { CurrentWeather } from '../../api/weather.api'
import { WeatherControls } from './components/WeatherControls'
import { WeatherMapCanvas } from './components/WeatherMapCanvas'
import { WeatherPageHeader } from './components/WeatherPageHeader'
import { getMapBounds, toMapFields } from './weather.helpers'
import { useRainViewerLayer } from './hooks/useRainViewerLayer'
import type { WeatherLayer } from './types/weather.types'

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
      <WeatherPageHeader weather={weather} />
      <WeatherControls
        activeLayer={activeLayer}
        fieldCount={mapFields.length}
        fieldWeatherCount={fieldWeatherCount}
        rainViewerTileUrl={rainViewerTileUrl}
        radarEnabled={radarEnabled}
        totalArea={totalArea}
        onActiveLayerChange={setActiveLayer}
        onRadarEnabledChange={setRadarEnabled}
      />
      <WeatherMapCanvas
        activeLayer={activeLayer}
        bounds={bounds}
        fieldWeatherById={fieldWeatherById}
        fields={mapFields}
        loading={loading}
        radarEnabled={radarEnabled}
        rainViewerTileUrl={rainViewerTileUrl}
      />
    </Box>
  )
}

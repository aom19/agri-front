import { Box, Stack, Typography } from '@mui/material'
import { divIcon } from 'leaflet'
import { CircleMarker, Marker, Polygon, Popup } from 'react-leaflet'
import type { CurrentWeather } from '../../../api/weather.api'
import {
  FIELD_POLYGON_COLOR,
  FIELD_POLYGON_FILL,
  WEATHER_ICON_SYMBOLS,
} from '../constants/weather.constants'
import {
  escapeHtml,
  formatArea,
  formatMetric,
  formatObservedAt,
  getLayerColor,
  getLayerRadius,
  getLayerValue,
  windDirectionLabel,
} from '../weather.helpers'
import type { MapField, WeatherLayer } from '../types/weather.types'

type WeatherFieldsLayerProps = {
  activeLayer: WeatherLayer
  fieldWeatherById: Map<string, CurrentWeather>
  fields: MapField[]
  radarEnabled: boolean
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
      <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary' }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.76rem', fontWeight: 700 }}>{value}</Typography>
    </Stack>
  )
}

export function WeatherFieldsLayer({
  activeLayer,
  fieldWeatherById,
  fields,
  radarEnabled,
}: WeatherFieldsLayerProps) {
  return fields.map((field) => {
    if (field.points.length === 0) return null
    const fieldWeather = fieldWeatherById.get(field.id)
    const labelColor = fieldWeather ? getLayerColor(activeLayer, fieldWeather) : FIELD_POLYGON_COLOR
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
        {!radarEnabled && fieldWeather && activeLayer !== 'none' && activeLayer !== 'wind' && (
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
              <Typography sx={{ fontSize: '0.82rem' }}>{formatArea(field.areaHa)}</Typography>
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
                    <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', pt: 0.25 }}>
                      {fieldWeather.source} • {formatObservedAt(fieldWeather.observed_at)}
                    </Typography>
                  </Stack>
                )}
              </Box>
            </Stack>
          </Popup>
        </Polygon>
        {!radarEnabled && <Marker position={field.center} icon={labelIcon} interactive={false} />}
      </Box>
    )
  })
}

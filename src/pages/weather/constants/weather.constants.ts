import type { LatLngTuple } from 'leaflet'
import type { WeatherIcon } from '../../../api/weather.api'
import type { WeatherLayer } from '../types/weather.types'

export const DEFAULT_CENTER: LatLngTuple = [46.27749, 28.20052]
export const FIELD_POLYGON_COLOR = '#10b981'
export const FIELD_POLYGON_FILL = 'rgba(16, 185, 129, 0.22)'
export const RADAR_ZOOM = 7

export const WEATHER_ICON_SYMBOLS: Record<WeatherIcon, string> = {
  sunny: '☀️',
  moon: '🌙',
  partly_cloudy: '🌤',
  cloudy: '☁️',
  rain: '🌧',
  snow: '❄️',
  showers: '🌦',
  storm: '⛈',
}

export const weatherLayerLabels: Record<WeatherLayer, string> = {
  none: 'Terenuri',
  temperature: 'Temperatură',
  humidity: 'Umiditate',
  wind: 'Vânt',
  precipitation: 'Precipitații',
}
import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet'
import type { Field, GeoJSONPolygon } from '../../api/fields.api'
import type { CurrentWeather } from '../../api/weather.api'
import { DEFAULT_CENTER } from './constants/weather.constants'
import type { MapField, WeatherLayer } from './types/weather.types'

export function escapeHtml(value: string) {
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

export function geoJSONToPoints(geometry: GeoJSONPolygon): LatLngTuple[] {
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

export function polygonCenter(points: LatLngTuple[]): LatLngTuple {
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

export function getMapBounds(fields: MapField[]): LatLngBoundsExpression | null {
    const allPoints = fields.flatMap((field) => field.points)
    if (allPoints.length === 0) return null

    const latitudes = allPoints.map((point) => point[0])
    const longitudes = allPoints.map((point) => point[1])

    return [
        [Math.min(...latitudes), Math.min(...longitudes)],
        [Math.max(...latitudes), Math.max(...longitudes)],
    ]
}

export function toMapFields(fields: Field[]): MapField[] {
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

export function formatObservedAt(value: string) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Actualizat recent'

    return new Intl.DateTimeFormat('ro-RO', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short',
    }).format(date)
}

export function formatArea(area: number | null) {
    if (area == null) return 'Suprafață necalculată'
    return `${area.toFixed(2)} ha`
}

export function formatMetric(value: number | undefined, unit: string) {
    if (value == null) return 'n/a'
    return `${value}${unit}`
}

export function getTemperatureColor(value: number | undefined) {
    if (value == null) return '#94a3b8'
    if (value < 8) return '#38bdf8'
    if (value < 18) return '#22c55e'
    if (value < 28) return '#f59e0b'
    return '#ef4444'
}

export function getHumidityColor(value: number | undefined) {
    if (value == null) return '#94a3b8'
    if (value < 35) return '#f59e0b'
    if (value < 70) return '#22c55e'
    return '#2563eb'
}

export function getPrecipitationColor(value: number | undefined) {
    if (value == null) return '#94a3b8'
    if (value <= 0) return '#a7f3d0'
    if (value < 1) return '#38bdf8'
    if (value < 4) return '#2563eb'
    return '#7c3aed'
}

export function getLayerColor(layer: WeatherLayer, weather: CurrentWeather) {
    if (layer === 'temperature') return getTemperatureColor(weather.temperature_c)
    if (layer === 'humidity') return getHumidityColor(weather.humidity_percent)
    if (layer === 'precipitation') return getPrecipitationColor(weather.precipitation_mm)
    return '#10b981'
}

export function getLayerValue(layer: WeatherLayer, weather: CurrentWeather) {
    if (layer === 'temperature') return `${weather.temperature_c}°C`
    if (layer === 'humidity') return formatMetric(weather.humidity_percent, '%')
    if (layer === 'precipitation') return formatMetric(weather.precipitation_mm, ' mm')
    if (layer === 'wind') return formatMetric(weather.wind_speed_kmh, ' km/h')
    return ''
}

export function getLayerRadius(layer: WeatherLayer, weather: CurrentWeather) {
    if (layer === 'temperature') return Math.max(22, Math.min(54, 22 + weather.temperature_c))
    if (layer === 'humidity')
        return Math.max(22, Math.min(58, 18 + (weather.humidity_percent ?? 0) / 2))
    if (layer === 'precipitation')
        return Math.max(22, Math.min(60, 24 + (weather.precipitation_mm ?? 0) * 8))
    return 28
}

export function windDirectionLabel(value: number | undefined) {
    if (value == null) return 'n/a'
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SV', 'V', 'NV']
    return directions[Math.round(value / 45) % directions.length]
}
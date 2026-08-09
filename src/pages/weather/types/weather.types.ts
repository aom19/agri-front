import type { LatLngTuple } from 'leaflet'

export type MapField = {
  id: string
  name: string
  areaHa: number | null
  cadastralNumber?: string | null
  points: LatLngTuple[]
  center: LatLngTuple
}

export type RainViewerMaps = {
  radar?: {
    past?: Array<{ path: string; time: number }>
    nowcast?: Array<{ path: string; time: number }>
  }
}

export type WeatherLayer = 'none' | 'temperature' | 'humidity' | 'wind' | 'precipitation'
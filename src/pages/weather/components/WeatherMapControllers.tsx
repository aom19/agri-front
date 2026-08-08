import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import type { LatLngBoundsExpression } from 'leaflet'
import { RADAR_ZOOM } from '../constants/weather.constants'

export function MapBoundsSetter({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap()

  useEffect(() => {
    if (!bounds) return
    if (map.getMinZoom() === RADAR_ZOOM && map.getMaxZoom() === RADAR_ZOOM) return
    map.fitBounds(bounds, { padding: [42, 42] })
  }, [bounds, map])

  return null
}

export function RadarZoomLock({ enabled }: { enabled: boolean }) {
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

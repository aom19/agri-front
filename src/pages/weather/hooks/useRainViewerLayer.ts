import { useEffect, useState } from 'react'
import type { RainViewerMaps } from '../types/weather.types'

export function useRainViewerLayer() {
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
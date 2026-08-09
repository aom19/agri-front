import { useQuery } from '@tanstack/react-query'
import { weatherApi, type CurrentWeatherParams } from '../api/weather.api'

export const CURRENT_WEATHER_KEY = ['current-weather', 'cantemir']

export function useCurrentWeather(params?: CurrentWeatherParams) {
    return useQuery({
        queryKey: params
            ? ['current-weather', params.lat.toFixed(4), params.lng.toFixed(4), params.location ?? 'teren']
            : CURRENT_WEATHER_KEY,
        queryFn: () => weatherApi.getCurrent(params),
        staleTime: 10 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 1,
    })
}

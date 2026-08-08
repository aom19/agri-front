import { api } from './axios'

export type CurrentWeather = {
    location: string
    temperature_c: number
    condition: string
    icon: WeatherIcon
    weather_code: number
    observed_at: string
    source: string
    humidity_percent?: number
    wind_speed_kmh?: number
    wind_direction_deg?: number
    precipitation_mm?: number
    cloud_cover_percent?: number
}

export type WeatherIcon =
    | 'sunny'
    | 'moon'
    | 'partly_cloudy'
    | 'cloudy'
    | 'rain'
    | 'snow'
    | 'showers'
    | 'storm'

export type CurrentWeatherParams = {
    lat: number
    lng: number
    location?: string
}

export const weatherApi = {
    getCurrent: (params?: CurrentWeatherParams) =>
        api.get<CurrentWeather>('/weather/current', { params }).then((r) => r.data),
}

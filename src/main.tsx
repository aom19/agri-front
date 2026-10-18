import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider, CssBaseline } from '@mui/material'
import theme from './theme'
import { useAuthStore } from './store/auth.store'
import 'leaflet/dist/leaflet.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Datele din cache aparțin contului care le-a cerut: la deconectare sau la schimbarea contului
// se golesc, ca următorul utilizator să nu vadă (nici pentru o clipă) lucrările altcuiva.
useAuthStore.subscribe((state, prev) => {
  const sessionEnded = Boolean(prev.accessToken) && !state.accessToken
  const userChanged = Boolean(prev.user) && state.user?.id !== prev.user?.id
  if (sessionEnded || userChanged) queryClient.clear()
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
)

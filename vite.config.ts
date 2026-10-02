/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
    server: {
      port: Number(env.VITE_APP_PORT) || 3000,
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      // Valorile din .env nu sunt încărcate în teste; axios.ts cere URL-ul API-ului la import.
      env: { VITE_API_BASE_URL: 'http://localhost:8080/api' },
      coverage: {
        provider: 'v8',
        reporter: ['text-summary', 'lcov'],
        reportsDirectory: 'coverage',
        include: ['src/**/*.{ts,tsx}'],
        // Paginile, layout-urile și fișierele de bootstrap sunt UI pur (MUI, hărți, grafice):
        // nu sunt măsurate în coverage. Lista e oglindită în sonar-project.properties.
        exclude: [
          'src/pages/**',
          'src/layouts/**',
          'src/routes/AppRoutes.tsx',
          'src/routes/components/**',
          'src/main.tsx',
          'src/App.tsx',
          'src/theme.ts',
          'src/test/**',
          'src/**/*.d.ts',
          'src/**/*.types.ts',
        ],
      },
    },
  }
})

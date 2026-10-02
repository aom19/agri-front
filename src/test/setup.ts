import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Curăță DOM-ul și starea persistată (zustand persist) după fiecare test.
afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

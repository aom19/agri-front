import { useEffect, useState } from 'react'

/** Întoarce valoarea după ce nu s-a mai schimbat timp de `delayMs` (ex.: cereri la tastare). */
export function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

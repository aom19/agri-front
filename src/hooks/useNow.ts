import { useEffect, useState } from 'react'

/** Momentul curent (ms), actualizat la `intervalMs`: pentru afișaje care curg cu timpul. */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(timer)
  }, [intervalMs])

  return now
}

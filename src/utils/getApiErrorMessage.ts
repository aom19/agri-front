import { isAxiosError } from 'axios'

/**
 * Extrage mesajul de eroare dintr-un răspuns API.
 * Backend-ul returnează:
 *   - { "error": "some message" }          — erori generice
 *   - { "errors": { field: "msg", ... } }  — erori de validare
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error) || !error.response?.data) return fallback

  const data = error.response.data as Record<string, unknown>

  // Eroare generică: { "error": "invalid credentials" }
  if (typeof data.error === 'string') return data.error

  // Erori de validare: { "errors": { "email": "required", ... } }
  if (data.errors && typeof data.errors === 'object') {
    const messages = Object.values(data.errors as Record<string, string>)
    return messages.join('. ')
  }

  return fallback
}

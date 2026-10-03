import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useDebouncedValue } from '../useDebouncedValue'

describe('useDebouncedValue', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('întoarce valoarea nouă doar după pauza cerută', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 1 },
    })
    rerender({ value: 2 })
    act(() => vi.advanceTimersByTime(200))
    rerender({ value: 3 })
    act(() => vi.advanceTimersByTime(200))
    expect(result.current).toBe(1)
    act(() => vi.advanceTimersByTime(100))
    expect(result.current).toBe(3)
  })
})

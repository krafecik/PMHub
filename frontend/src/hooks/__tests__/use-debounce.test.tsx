import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '../use-debounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('retorna o valor debounced após o delay configurado', () => {
    const delay = 300
    const { result, rerender } = renderHook(
      ({ value, wait }: { value: string; wait: number }) => useDebounce(value, wait),
      {
        initialProps: { value: 'inicial', wait: delay },
      },
    )

    expect(result.current).toBe('inicial')

    rerender({ value: 'atualizado', wait: delay })

    expect(result.current).toBe('inicial')

    act(() => {
      vi.advanceTimersByTime(delay - 1)
    })
    expect(result.current).toBe('inicial')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('atualizado')
  })
})

import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDebounced } from '@/lib/useDebounced'
import { extractOutline } from '../outline'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('useDebounced', () => {
  it('delays updates by the given interval', () => {
    const { result, rerender } = renderHook(({ v }) => useDebounced(v, 200), {
      initialProps: { v: 'a' },
    })
    expect(result.current).toBe('a')

    rerender({ v: 'b' })
    expect(result.current).toBe('a') // not yet

    act(() => vi.advanceTimersByTime(199))
    expect(result.current).toBe('a')

    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe('b')
  })

  it('collapses rapid changes into one update (debounce)', () => {
    const { result, rerender } = renderHook(({ v }) => useDebounced(v, 200), {
      initialProps: { v: 0 },
    })
    for (let i = 1; i <= 50; i++) {
      rerender({ v: i })
      act(() => vi.advanceTimersByTime(10)) // < 200ms between keystrokes
    }
    expect(result.current).toBe(0) // never settled mid-typing
    act(() => vi.advanceTimersByTime(200))
    expect(result.current).toBe(50) // only the final value lands
  })
})

describe('outline on a very long note (~5,000 lines)', () => {
  it('extracts headings from a 5,000-line note quickly', () => {
    const lines: string[] = []
    for (let i = 0; i < 5000; i++) {
      lines.push(i % 50 === 0 ? `## Section ${i / 50}` : `body line ${i}`)
    }
    const md = lines.join('\n')

    const start = performance.now()
    const outline = extractOutline(md)
    const elapsed = performance.now() - start

    expect(outline).toHaveLength(100)
    expect(outline[1]).toMatchObject({ level: 2, text: 'Section 1', line: 50 })
    expect(elapsed).toBeLessThan(200) // comfortably fast
  })
})

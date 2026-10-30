import { describe, expect, it } from 'vitest'
import { daysUntil, toISODate, countdownLabel } from '../dates'

const FROM = new Date('2026-10-17T09:30:00') // fixed "today" for determinism

describe('daysUntil', () => {
  it('counts calendar days to a future date', () => {
    expect(daysUntil('2026-11-13', FROM)).toBe(27)
  })

  it('returns 0 for the same day regardless of time', () => {
    expect(daysUntil('2026-10-17', FROM)).toBe(0)
  })

  it('is negative for past dates', () => {
    expect(daysUntil('2026-10-10', FROM)).toBe(-7)
  })

  it('returns null when no date is given', () => {
    expect(daysUntil(undefined, FROM)).toBeNull()
  })

  it('ignores time of day (calendar-day difference)', () => {
    const lateNight = new Date('2026-10-17T23:59:00')
    expect(daysUntil('2026-10-18', lateNight)).toBe(1)
  })
})

describe('toISODate', () => {
  it('formats as yyyy-MM-dd', () => {
    expect(toISODate(new Date('2026-11-13T15:00:00'))).toBe('2026-11-13')
  })
})

describe('countdownLabel', () => {
  it('labels day deltas', () => {
    expect(countdownLabel(27)).toBe('27 days')
    expect(countdownLabel(1)).toBe('Tomorrow')
    expect(countdownLabel(0)).toBe('Today')
    expect(countdownLabel(-1)).toBe('Yesterday')
    expect(countdownLabel(-3)).toBe('3 days ago')
  })
})

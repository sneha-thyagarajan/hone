import { describe, expect, it } from 'vitest'
import { getDay, isSameDay } from 'date-fns'
import { buildMonthMatrix, monthTitle, nextMonth, prevMonth } from '../calendarGrid'

describe('buildMonthMatrix', () => {
  const grid = buildMonthMatrix(new Date('2026-11-15'))

  it('returns a 42-cell grid', () => {
    expect(grid).toHaveLength(42)
  })

  it('starts on a Sunday', () => {
    expect(getDay(grid[0])).toBe(0)
  })

  it('contains the first of the month', () => {
    expect(grid.some((d) => isSameDay(d, new Date('2026-11-01')))).toBe(true)
  })

  it('contains the last of the month', () => {
    expect(grid.some((d) => isSameDay(d, new Date('2026-11-30')))).toBe(true)
  })
})

describe('month navigation + title', () => {
  it('titles the month', () => {
    expect(monthTitle(new Date('2026-11-01'))).toBe('November 2026')
  })

  it('moves to next and previous month', () => {
    expect(monthTitle(nextMonth(new Date('2026-11-15')))).toBe('December 2026')
    expect(monthTitle(prevMonth(new Date('2026-01-15')))).toBe('December 2025')
  })
})

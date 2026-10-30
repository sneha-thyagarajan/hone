import { addDays, addMonths, format, startOfMonth, startOfWeek, subMonths } from 'date-fns'

/**
 * The 42-cell (6-week) grid for a month view, starting on the Sunday on or
 * before the 1st. Pure so it can be unit-tested.
 */
export function buildMonthMatrix(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

export function monthTitle(month: Date): string {
  return format(month, 'MMMM yyyy')
}

export function nextMonth(month: Date): Date {
  return addMonths(month, 1)
}

export function prevMonth(month: Date): Date {
  return subMonths(month, 1)
}

export const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

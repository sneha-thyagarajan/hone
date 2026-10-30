import { differenceInCalendarDays, format, parseISO } from 'date-fns'

/**
 * Whole calendar days from `from` to an ISO date (ignores time of day), so a
 * countdown is stable regardless of when during the day it's computed.
 * `from` is injectable for testing. Returns null if no date is given.
 */
export function daysUntil(isoDate: string | undefined, from: Date = new Date()): number | null {
  if (!isoDate) return null
  return differenceInCalendarDays(parseISO(isoDate), from)
}

/** Format a Date as a yyyy-MM-dd string (local). */
export function toISODate(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

/** A short, human countdown label from a day delta. */
export function countdownLabel(days: number): string {
  if (days > 1) return `${days} days`
  if (days === 1) return 'Tomorrow'
  if (days === 0) return 'Today'
  if (days === -1) return 'Yesterday'
  return `${Math.abs(days)} days ago`
}

import { differenceInDays, parseISO } from 'date-fns'

/** Days from today to an ISO date string. Returns null if no date given. */
export function daysUntil(isoDate: string | undefined): number | null {
  if (!isoDate) return null
  return differenceInDays(parseISO(isoDate), new Date())
}

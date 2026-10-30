import { useFolders } from '@/features/folders/useFolders'
import { daysUntil } from '@/lib/dates'
import type { Folder } from '@/db/types'

/** Folders with a future (or today) exam date, soonest first. */
export function useUpcomingExams(): Folder[] {
  const folders = useFolders()
  return folders
    .filter((f) => f.examDate && (daysUntil(f.examDate) ?? -1) >= 0)
    .sort((a, b) => (daysUntil(a.examDate) ?? 0) - (daysUntil(b.examDate) ?? 0))
}

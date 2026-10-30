import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'

/**
 * Readiness = average of the most recent attempt score across the folder's
 * quiz / mock / flashcard files. Plain arithmetic, no AI. Returns 0 when there
 * are no attempts yet.
 */
export function useReadiness(folderId: number | undefined): number {
  return (
    useLiveQuery(async () => {
      if (folderId === undefined) return 0
      const files = await db.files.where({ folderId }).toArray()
      const scored = files.filter(
        (f) => f.type === 'quiz' || f.type === 'mock' || f.type === 'flashcards',
      )
      if (scored.length === 0) return 0

      let total = 0
      let counted = 0
      for (const f of scored) {
        const latest = await db.attempts.where({ fileId: f.id }).last()
        if (latest) {
          total += latest.score
          counted++
        }
      }
      return counted === 0 ? 0 : Math.round(total / counted)
    }, [folderId]) ?? 0
  )
}

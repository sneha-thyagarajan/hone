import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import type { HoneFile } from '@/db/types'

const CONTINUABLE = ['note', 'notes_ai', 'code', 'flashcards']

/** The most recently opened note / practice / study file, if any. */
export function useContinueFile(): HoneFile | undefined {
  return useLiveQuery(async () => {
    const files = await db.files
      .filter((f) => f.openedAt != null && CONTINUABLE.includes(f.type))
      .toArray()
    if (files.length === 0) return undefined
    return files.sort((a, b) => (b.openedAt ?? 0) - (a.openedAt ?? 0))[0]
  }, [])
}

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import type { Attempt } from '@/db/types'
import type { Language } from '@/runner/types'
import type { NoteTab } from './noteTabs'

export interface SaveSnapshotInput {
  fileId: number
  language: Language
  code: string
  noteTabs: NoteTab[]
  activeTab: string
}

/** Save the current code AND notes as a timestamped snapshot you can restore. */
export async function saveSnapshot(input: SaveSnapshotInput): Promise<number> {
  return db.attempts.add({
    fileId: input.fileId,
    kind: 'code',
    score: 0,
    detail: {
      language: input.language,
      code: input.code,
      noteTabs: input.noteTabs,
      activeTab: input.activeTab,
    },
    at: Date.now(),
  })
}

export async function deleteSnapshot(id: number): Promise<void> {
  await db.attempts.delete(id)
}

/** Snapshots for a file, most recent first. */
export function useSnapshots(fileId: number | undefined): Attempt[] {
  return (
    useLiveQuery(async () => {
      if (fileId === undefined) return [] as Attempt[]
      const rows = await db.attempts.where({ fileId }).toArray()
      return rows.sort((a, b) => b.at - a.at)
    }, [fileId]) ?? []
  )
}

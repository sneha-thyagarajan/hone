import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import type { Chunk } from '@/db/types'

/** All chunks for a file, ordered by page then insertion order. */
export function useChunks(fileId: number | undefined): Chunk[] {
  return (
    useLiveQuery(async () => {
      if (fileId === undefined) return [] as Chunk[]
      const chunks = await db.chunks.where({ fileId }).toArray()
      return chunks.sort((a, b) => (a.page ?? 0) - (b.page ?? 0) || (a.id ?? 0) - (b.id ?? 0))
    }, [fileId]) ?? []
  )
}

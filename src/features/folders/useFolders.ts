import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import type { Folder } from '@/db/types'

/** Live-updating list of all folders, sorted by creation date. */
export function useFolders(): Folder[] {
  return useLiveQuery(() => db.folders.orderBy('createdAt').toArray(), [], [])
}

/** Single folder by id. Returns undefined while loading or if not found. */
export function useFolder(id: number | undefined): Folder | undefined {
  return useLiveQuery(() => (id !== undefined ? db.folders.get(id) : undefined), [id])
}

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import type { HoneFile } from '@/db/types'

/** All files in a folder, sorted by creation date. */
export function useFiles(folderId: number | undefined): HoneFile[] {
  return (
    useLiveQuery(
      () =>
        folderId !== undefined
          ? db.files.where({ folderId }).sortBy('createdAt')
          : Promise.resolve([] as HoneFile[]),
      [folderId],
    ) ?? []
  )
}

/** Single file by id. */
export function useFile(id: number | undefined): HoneFile | undefined {
  return useLiveQuery(() => (id !== undefined ? db.files.get(id) : undefined), [id])
}

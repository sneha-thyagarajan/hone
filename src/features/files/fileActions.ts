import { db } from '@/db'
import type { FileType, HoneFile } from '@/db/types'

export interface CreateFileInput {
  folderId: number
  type: FileType
  name: string
  content?: string
  meta?: Record<string, unknown>
}

export async function createFile(input: CreateFileInput): Promise<number> {
  const name = input.name.trim()
  if (!name) throw new Error('File name cannot be empty')
  const now = Date.now()
  return db.files.add({
    folderId: input.folderId,
    type: input.type,
    name,
    content: input.content ?? '',
    meta: input.meta,
    createdAt: now,
    updatedAt: now,
  })
}

export async function renameFile(id: number, name: string): Promise<void> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('File name cannot be empty')
  await db.files.update(id, { name: trimmed, updatedAt: Date.now() })
}

export async function saveFileContent(id: number, content: string): Promise<void> {
  await db.files.update(id, { content, updatedAt: Date.now() })
}

/** Mark a file as just opened (powers Home's "Continue studying"). */
export async function touchFile(id: number): Promise<void> {
  await db.files.update(id, { openedAt: Date.now() })
}

/** Deletes a file and its chunks, attempts, and any blobs it owns. */
export async function deleteFile(id: number): Promise<void> {
  await db.transaction('rw', db.files, db.chunks, db.attempts, db.blobs, async () => {
    const file = await db.files.get(id)
    const blobIds = collectBlobIds(file)
    await db.attempts.where({ fileId: id }).delete()
    await db.chunks.where({ fileId: id }).delete()
    if (blobIds.length) await db.blobs.bulkDelete(blobIds)
    await db.files.delete(id)
  })
}

/** The original-upload blob plus any note-image blobs the file references. */
function collectBlobIds(file: HoneFile | undefined): string[] {
  if (!file) return []
  const ids: string[] = []
  if (file.blobId) ids.push(file.blobId)
  const tabs = file.meta?.noteTabs as Array<{ kind?: string; images?: string[] }> | undefined
  if (Array.isArray(tabs)) {
    for (const t of tabs) {
      if (t.kind === 'image' && Array.isArray(t.images)) ids.push(...t.images)
    }
  }
  return ids
}

export async function getFile(id: number): Promise<HoneFile | undefined> {
  return db.files.get(id)
}

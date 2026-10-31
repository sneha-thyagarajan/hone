import { db } from '@/db'
import type { Folder, FolderKind } from '@/db/types'

export interface CreateFolderInput {
  name: string
  kind: FolderKind
  examDate?: string
}

export async function createFolder(input: CreateFolderInput): Promise<number> {
  const name = input.name.trim()
  if (!name) throw new Error('Folder name cannot be empty')
  return db.folders.add({ name, kind: input.kind, examDate: input.examDate, createdAt: Date.now() })
}

export async function renameFolder(id: number, name: string): Promise<void> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Folder name cannot be empty')
  await db.folders.update(id, { name: trimmed })
}

export async function updateFolderExamDate(id: number, examDate: string | undefined): Promise<void> {
  await db.folders.update(id, { examDate })
}

/** Change a folder's kind. Never touches existing files. */
export async function updateFolderKind(id: number, kind: FolderKind): Promise<void> {
  await db.folders.update(id, { kind })
}

/** Deletes a folder and all its files (plus their chunks and attempts). */
export async function deleteFolder(id: number): Promise<void> {
  await db.transaction('rw', db.folders, db.files, db.chunks, db.attempts, async () => {
    const fileIds = await db.files.where({ folderId: id }).primaryKeys()
    await db.attempts.where('fileId').anyOf(fileIds).delete()
    await db.chunks.where('fileId').anyOf(fileIds).delete()
    await db.files.where({ folderId: id }).delete()
    await db.folders.delete(id)
  })
}

export async function getFolder(id: number): Promise<Folder | undefined> {
  return db.folders.get(id)
}

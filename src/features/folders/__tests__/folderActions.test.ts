import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import {
  createFolder,
  deleteFolder,
  renameFolder,
  updateFolderExamDate,
} from '../folderActions'

beforeEach(async () => {
  // Reset the DB between tests by clearing all tables
  await db.folders.clear()
  await db.files.clear()
  await db.chunks.clear()
  await db.attempts.clear()
})

describe('createFolder', () => {
  it('persists a folder and returns its id', async () => {
    const id = await createFolder({ name: 'Data Structures', kind: 'theory' })
    const folder = await db.folders.get(id)
    expect(folder).toBeDefined()
    expect(folder?.name).toBe('Data Structures')
    expect(folder?.kind).toBe('theory')
  })

  it('trims whitespace from the name', async () => {
    const id = await createFolder({ name: '  Machine Learning  ', kind: 'mixed' })
    const folder = await db.folders.get(id)
    expect(folder?.name).toBe('Machine Learning')
  })

  it('throws when the name is blank', async () => {
    await expect(createFolder({ name: '   ', kind: 'theory' })).rejects.toThrow(
      'Folder name cannot be empty',
    )
  })

  it('stores an optional exam date', async () => {
    const id = await createFolder({ name: 'OS', kind: 'theory', examDate: '2026-11-27' })
    const folder = await db.folders.get(id)
    expect(folder?.examDate).toBe('2026-11-27')
  })
})

describe('renameFolder', () => {
  it('updates the folder name', async () => {
    const id = await createFolder({ name: 'Old Name', kind: 'theory' })
    await renameFolder(id, 'New Name')
    const folder = await db.folders.get(id)
    expect(folder?.name).toBe('New Name')
  })

  it('throws when the new name is blank', async () => {
    const id = await createFolder({ name: 'Valid', kind: 'coding' })
    await expect(renameFolder(id, '')).rejects.toThrow('Folder name cannot be empty')
  })
})

describe('updateFolderExamDate', () => {
  it('sets an exam date', async () => {
    const id = await createFolder({ name: 'DS', kind: 'theory' })
    await updateFolderExamDate(id, '2026-11-13')
    expect((await db.folders.get(id))?.examDate).toBe('2026-11-13')
  })

  it('clears the exam date when passed undefined', async () => {
    const id = await createFolder({ name: 'DS', kind: 'theory', examDate: '2026-11-13' })
    await updateFolderExamDate(id, undefined)
    expect((await db.folders.get(id))?.examDate).toBeUndefined()
  })
})

describe('deleteFolder', () => {
  it('removes the folder', async () => {
    const id = await createFolder({ name: 'To Delete', kind: 'theory' })
    await deleteFolder(id)
    const folder = await db.folders.get(id)
    expect(folder).toBeUndefined()
  })

  it('removes child files and their chunks/attempts', async () => {
    const folderId = await createFolder({ name: 'Parent', kind: 'mixed' })
    const fileId = await db.files.add({
      folderId,
      type: 'note',
      name: 'Test note',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    await db.chunks.add({ fileId, source: 'test', text: 'hello' })
    await db.attempts.add({ fileId, kind: 'quiz', score: 80, at: Date.now() })

    await deleteFolder(folderId)

    expect(await db.folders.get(folderId)).toBeUndefined()
    expect(await db.files.where({ folderId }).count()).toBe(0)
    expect(await db.chunks.where({ fileId }).count()).toBe(0)
    expect(await db.attempts.where({ fileId }).count()).toBe(0)
  })
})

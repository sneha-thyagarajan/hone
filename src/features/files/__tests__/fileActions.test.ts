import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { createFolder } from '@/features/folders/folderActions'
import { createFile, deleteFile, renameFile, saveFileContent } from '../fileActions'

let folderId: number

beforeEach(async () => {
  await db.folders.clear()
  await db.files.clear()
  await db.chunks.clear()
  await db.attempts.clear()
  folderId = await createFolder({ name: 'Test Folder', kind: 'theory' })
})

describe('createFile', () => {
  it('persists a note and returns its id', async () => {
    const id = await createFile({ folderId, type: 'note', name: 'My note' })
    const file = await db.files.get(id)
    expect(file?.name).toBe('My note')
    expect(file?.type).toBe('note')
    expect(file?.folderId).toBe(folderId)
    expect(file?.content).toBe('')
  })

  it('trims whitespace from the name', async () => {
    const id = await createFile({ folderId, type: 'note', name: '  Heaps  ' })
    const file = await db.files.get(id)
    expect(file?.name).toBe('Heaps')
  })

  it('throws when name is blank', async () => {
    await expect(createFile({ folderId, type: 'note', name: '   ' })).rejects.toThrow(
      'File name cannot be empty',
    )
  })

  it('stores initial content', async () => {
    const id = await createFile({ folderId, type: 'note', name: 'Note', content: '# Hello' })
    const file = await db.files.get(id)
    expect(file?.content).toBe('# Hello')
  })
})

describe('renameFile', () => {
  it('updates the file name', async () => {
    const id = await createFile({ folderId, type: 'note', name: 'Old' })
    await renameFile(id, 'New')
    const file = await db.files.get(id)
    expect(file?.name).toBe('New')
  })

  it('throws on blank name', async () => {
    const id = await createFile({ folderId, type: 'note', name: 'Valid' })
    await expect(renameFile(id, '')).rejects.toThrow('File name cannot be empty')
  })
})

describe('saveFileContent', () => {
  it('updates content and bumps updatedAt', async () => {
    const id = await createFile({ folderId, type: 'note', name: 'Note' })
    const before = (await db.files.get(id))!.updatedAt

    await saveFileContent(id, '# Updated')

    const file = await db.files.get(id)
    expect(file?.content).toBe('# Updated')
    expect(file!.updatedAt).toBeGreaterThanOrEqual(before)
  })
})

describe('deleteFile', () => {
  it('removes the file', async () => {
    const id = await createFile({ folderId, type: 'note', name: 'To Delete' })
    await deleteFile(id)
    expect(await db.files.get(id)).toBeUndefined()
  })

  it('removes associated chunks and attempts', async () => {
    const id = await createFile({ folderId, type: 'note', name: 'With data' })
    await db.chunks.add({ fileId: id, source: 'test', text: 'chunk' })
    await db.attempts.add({ fileId: id, kind: 'quiz', score: 90, at: Date.now() })

    await deleteFile(id)

    expect(await db.chunks.where({ fileId: id }).count()).toBe(0)
    expect(await db.attempts.where({ fileId: id }).count()).toBe(0)
  })
})

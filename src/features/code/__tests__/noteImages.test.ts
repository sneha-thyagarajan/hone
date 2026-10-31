import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { deleteImageBlobs } from '../noteImages'
import { deleteFile, createFile } from '@/features/files/fileActions'
import { createFolder } from '@/features/folders/folderActions'

beforeEach(async () => {
  await db.blobs.clear()
  await db.files.clear()
  await db.folders.clear()
})

async function addBlob(id: string) {
  await db.blobs.add({ id, name: id, type: 'image/jpeg', data: new Blob(['x']) })
}

describe('deleteImageBlobs', () => {
  it('removes only the given blobs', async () => {
    await addBlob('a')
    await addBlob('b')
    await addBlob('c')
    await deleteImageBlobs(['a', 'c'])
    expect(await db.blobs.get('a')).toBeUndefined()
    expect(await db.blobs.get('c')).toBeUndefined()
    expect(await db.blobs.get('b')).toBeDefined()
  })

  it('is a no-op for an empty list', async () => {
    await addBlob('a')
    await deleteImageBlobs([])
    expect(await db.blobs.get('a')).toBeDefined()
  })
})

describe('deleteFile cleans up note-image blobs', () => {
  it('removes blobs referenced by image tabs when the file is deleted', async () => {
    const folderId = await createFolder({ name: 'DS', kind: 'coding' })
    await addBlob('img1')
    await addBlob('img2')
    const fileId = await createFile({
      folderId,
      type: 'code',
      name: 'practice',
      meta: {
        noteTabs: [
          { id: 'problem', title: 'Problem', kind: 'text', text: 'hi' },
          { id: 'x', title: 'Images', kind: 'image', images: ['img1', 'img2'] },
        ],
      },
    })

    await deleteFile(fileId)

    expect(await db.blobs.get('img1')).toBeUndefined()
    expect(await db.blobs.get('img2')).toBeUndefined()
  })
})

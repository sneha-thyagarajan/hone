import { create } from 'zustand'
import { db } from '@/db'
import { chunkPages } from '@/parsers/chunker'
import { parseInWorker } from '@/parsers/parseClient'
import { detectType } from '@/parsers/types'

export interface UploadJob {
  id: string
  name: string
  status: 'parsing' | 'done' | 'error'
  page?: number
  total?: number
  error?: string
}

interface UploadState {
  jobs: UploadJob[]
  startUploads: (folderId: number, files: File[]) => Promise<void>
  dismiss: (id: string) => void
}

function friendlyError(err: unknown, name: string): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (/password|encrypted/i.test(msg)) return `${name} is password-protected and can't be read.`
  if (/invalid|corrupt|malformed/i.test(msg)) return `${name} looks corrupted or isn't a valid file.`
  return `Couldn't read ${name}. ${msg}`
}

export const useUploadStore = create<UploadState>((set, get) => ({
  jobs: [],

  dismiss: (id) => set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) })),

  startUploads: async (folderId, files) => {
    for (const file of files) {
      const id = crypto.randomUUID()
      const patch = (p: Partial<UploadJob>) =>
        set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...p } : j)) }))

      set((s) => ({ jobs: [...s.jobs, { id, name: file.name, status: 'parsing' }] }))

      const type = detectType(file.name)
      if (!type) {
        patch({ status: 'error', error: `${file.name} isn't a supported file type.` })
        continue
      }

      let fileId: number | undefined
      try {
        const data = await file.arrayBuffer()
        const blobId = crypto.randomUUID()
        await db.blobs.add({ id: blobId, name: file.name, type: file.type, data: file })

        const now = Date.now()
        fileId = await db.files.add({
          folderId,
          type: 'upload',
          name: file.name,
          blobId,
          meta: { ext: type, size: file.size },
          createdAt: now,
          updatedAt: now,
        })

        const pages = await parseInWorker(type, file.name, data, (page, total) =>
          patch({ page, total }),
        )
        const chunks = chunkPages(pages, file.name)
        if (chunks.length) {
          await db.chunks.bulkAdd(
            chunks.map((c) => ({ fileId: fileId!, source: c.source, page: c.page, text: c.text })),
          )
        }
        await db.files.update(fileId, {
          meta: {
            ext: type,
            size: file.size,
            pageCount: pages.length,
            chunkCount: chunks.length,
            parsedAt: Date.now(),
          },
          updatedAt: Date.now(),
        })

        patch({ status: 'done', page: pages.length, total: pages.length })
        setTimeout(() => get().dismiss(id), 4000)
      } catch (err) {
        if (fileId !== undefined) {
          await db.files.update(fileId, {
            meta: {
              ext: type,
              size: file.size,
              parseError: err instanceof Error ? err.message : String(err),
            },
          })
        }
        patch({ status: 'error', error: friendlyError(err, file.name) })
      }
    }
  },
}))

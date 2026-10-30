import type { ParseableType, ParsedPage, ProgressFn } from './types'

interface Pending {
  resolve: (pages: ParsedPage[]) => void
  reject: (err: Error) => void
  onProgress?: ProgressFn
}

let worker: Worker | null = null
let nextId = 1
const pending = new Map<number, Pending>()

function getWorker(): Worker {
  if (worker) return worker
  worker = new Worker(new URL('./parseWorker.ts', import.meta.url), { type: 'module' })

  worker.onmessage = (e: MessageEvent) => {
    const msg = e.data as
      | { id: number; kind: 'progress'; page: number; total: number }
      | { id: number; kind: 'done'; pages: ParsedPage[] }
      | { id: number; kind: 'error'; message: string }
    const job = pending.get(msg.id)
    if (!job) return
    if (msg.kind === 'progress') {
      job.onProgress?.(msg.page, msg.total)
    } else if (msg.kind === 'done') {
      pending.delete(msg.id)
      job.resolve(msg.pages)
    } else {
      pending.delete(msg.id)
      job.reject(new Error(msg.message))
    }
  }

  worker.onerror = (e) => {
    const err = new Error(e.message || 'Parser worker crashed')
    for (const job of pending.values()) job.reject(err)
    pending.clear()
  }

  return worker
}

/** Parse a file's bytes off the main thread. Transfers the buffer to the worker. */
export function parseInWorker(
  type: ParseableType,
  name: string,
  data: ArrayBuffer,
  onProgress?: ProgressFn,
): Promise<ParsedPage[]> {
  const w = getWorker()
  const id = nextId++
  return new Promise<ParsedPage[]>((resolve, reject) => {
    pending.set(id, { resolve, reject, onProgress })
    w.postMessage({ id, type, name, data }, [data])
  })
}

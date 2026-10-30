import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
import { parseDocument } from './index'
import type { ParseableType } from './types'

// pdf.js runs its own worker; point it at the bundled worker file.
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

interface ParseRequest {
  id: number
  type: ParseableType
  name: string
  data: ArrayBuffer
}

const post = (msg: unknown) =>
  (self as unknown as { postMessage: (m: unknown) => void }).postMessage(msg)

self.onmessage = async (e: MessageEvent<ParseRequest>) => {
  const { id, type, data } = e.data
  try {
    const pages = await parseDocument(type, data, (page, total) =>
      post({ id, kind: 'progress', page, total }),
    )
    post({ id, kind: 'done', pages })
  } catch (err) {
    post({ id, kind: 'error', message: err instanceof Error ? err.message : String(err) })
  }
}

import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import type { ParsedPage, ProgressFn } from './types'

type TextItem = { str: string; hasEOL?: boolean }

/** Extract text from a PDF, one ParsedPage per page. */
export async function parsePdf(
  data: ArrayBuffer | Uint8Array,
  onProgress?: ProgressFn,
): Promise<ParsedPage[]> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
  const task = pdfjs.getDocument({ data: bytes })
  const doc = await task.promise
  const pages: ParsedPage[] = []

  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      let text = ''
      for (const item of content.items as TextItem[]) {
        if (typeof item.str !== 'string') continue
        text += item.str
        text += item.hasEOL ? '\n' : ' '
      }
      pages.push({ page: i, text: text.trim() })
      page.cleanup()
      onProgress?.(i, doc.numPages)
    }
  } finally {
    await task.destroy()
  }

  return pages
}

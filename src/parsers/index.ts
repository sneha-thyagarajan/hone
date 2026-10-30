import { parseDocx } from './docx'
import { parsePdf } from './pdf'
import { parsePptx } from './pptx'
import { parseText } from './text'
import type { ParseableType, ParsedPage, ProgressFn } from './types'

export { chunkPages } from './chunker'
export { detectType, ACCEPT_EXTENSIONS } from './types'
export type { ParsedPage, ChunkInput, ParseableType } from './types'

/** Parse a file's bytes into pages using the parser for its type. */
export async function parseDocument(
  type: ParseableType,
  data: ArrayBuffer | Uint8Array,
  onProgress?: ProgressFn,
): Promise<ParsedPage[]> {
  switch (type) {
    case 'pdf':
      return parsePdf(data, onProgress)
    case 'pptx':
      return parsePptx(data, onProgress)
    case 'docx':
      return parseDocx(data)
    case 'md':
    case 'txt':
      return parseText(data)
    default:
      throw new Error('Unsupported file type')
  }
}

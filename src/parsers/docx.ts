import mammoth from 'mammoth/mammoth.browser'
import type { ParsedPage } from './types'

/**
 * Extract text from a DOCX. Word documents have no fixed pages, so the whole
 * document is returned as a single ParsedPage; the chunker splits it further.
 */
export async function parseDocx(data: ArrayBuffer | Uint8Array): Promise<ParsedPage[]> {
  const arrayBuffer = data instanceof Uint8Array ? toArrayBuffer(data) : data
  const result = await mammoth.extractRawText({ arrayBuffer })
  return [{ page: 1, text: result.value.trim() }]
}

function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer
}

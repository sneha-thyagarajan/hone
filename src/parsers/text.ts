import type { ParsedPage } from './types'

/** Decode a Markdown or plain-text file as UTF-8 into a single ParsedPage. */
export function parseText(data: ArrayBuffer | Uint8Array): ParsedPage[] {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
  const text = new TextDecoder('utf-8').decode(bytes)
  return [{ page: 1, text: text.trim() }]
}

import type { ChunkInput, ParsedPage } from './types'

const DEFAULT_MAX_CHARS = 1200

/**
 * Split extracted pages into chunks that stay under `maxChars`, preserving the
 * source filename and page/slide number so citations survive.
 *
 * Splitting prefers paragraph boundaries, falls back to sentence boundaries for
 * oversized paragraphs, and hard-slices as a last resort so no chunk is wildly
 * larger than the limit.
 */
export function chunkPages(
  pages: ParsedPage[],
  source: string,
  opts: { maxChars?: number } = {},
): ChunkInput[] {
  const maxChars = opts.maxChars ?? DEFAULT_MAX_CHARS
  const chunks: ChunkInput[] = []

  for (const { page, text } of pages) {
    const clean = normalize(text)
    if (!clean) continue

    let buf = ''
    const flush = () => {
      const t = buf.trim()
      if (t) chunks.push({ source, page, text: t })
      buf = ''
    }

    for (const para of clean.split(/\n{2,}/)) {
      const p = para.trim()
      if (!p) continue

      if (p.length > maxChars) {
        flush()
        for (const piece of splitLong(p, maxChars)) {
          chunks.push({ source, page, text: piece })
        }
      } else if (buf && buf.length + 2 + p.length > maxChars) {
        flush()
        buf = p
      } else {
        buf = buf ? `${buf}\n\n${p}` : p
      }
    }
    flush()
  }

  return chunks
}

function normalize(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Split an oversized paragraph on sentence boundaries, hard-slicing if needed. */
function splitLong(para: string, maxChars: number): string[] {
  const out: string[] = []
  let buf = ''
  for (const sentence of para.split(/(?<=[.!?])\s+/)) {
    if (sentence.length > maxChars) {
      if (buf.trim()) out.push(buf.trim())
      buf = ''
      for (let i = 0; i < sentence.length; i += maxChars) {
        out.push(sentence.slice(i, i + maxChars))
      }
      continue
    }
    if (buf && buf.length + 1 + sentence.length > maxChars) {
      out.push(buf.trim())
      buf = sentence
    } else {
      buf = buf ? `${buf} ${sentence}` : sentence
    }
  }
  if (buf.trim()) out.push(buf.trim())
  return out
}

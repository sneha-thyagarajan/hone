import JSZip from 'jszip'
import type { ParsedPage, ProgressFn } from './types'

const SLIDE_RE = /^ppt\/slides\/slide(\d+)\.xml$/

/** Extract text from a PPTX, one ParsedPage per slide (in slide order). */
export async function parsePptx(
  data: ArrayBuffer | Uint8Array,
  onProgress?: ProgressFn,
): Promise<ParsedPage[]> {
  const zip = await JSZip.loadAsync(data)

  const slides = Object.keys(zip.files)
    .map((name) => {
      const m = name.match(SLIDE_RE)
      return m ? { name, n: Number(m[1]) } : null
    })
    .filter((x): x is { name: string; n: number } => x !== null)
    .sort((a, b) => a.n - b.n)

  const pages: ParsedPage[] = []
  for (let i = 0; i < slides.length; i++) {
    const xml = await zip.files[slides[i].name].async('string')
    const text = extractSlideText(xml)
    pages.push({ page: slides[i].n, text })
    onProgress?.(i + 1, slides.length)
  }

  return pages
}

/** Pull the text out of every <a:t> run in a slide's XML. */
function extractSlideText(xml: string): string {
  const runs: string[] = []
  for (const m of xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)) {
    runs.push(decodeXmlEntities(m[1]))
  }
  // Paragraph breaks (<a:p>) become blank lines so the chunker can split on them
  return runs.join(' ').replace(/[ \t]+/g, ' ').trim()
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

/** A unit of extracted text tagged with its page/slide number. */
export interface ParsedPage {
  /** 1-based page (PDF), slide (PPTX), or 1 for single-flow docs (DOCX/MD/TXT). */
  page: number
  text: string
}

/** A chunk ready to be written to the `chunks` table. */
export interface ChunkInput {
  source: string
  page?: number
  text: string
}

export type ParseableType = 'pdf' | 'pptx' | 'docx' | 'md' | 'txt'

export type ProgressFn = (page: number, total: number) => void

/** Map a filename to a supported parser type, or null if unsupported. */
export function detectType(name: string): ParseableType | null {
  const ext = name.toLowerCase().split('.').pop() ?? ''
  switch (ext) {
    case 'pdf':
      return 'pdf'
    case 'pptx':
      return 'pptx'
    case 'docx':
      return 'docx'
    case 'md':
    case 'markdown':
      return 'md'
    case 'txt':
      return 'txt'
    default:
      return null
  }
}

export const ACCEPT_EXTENSIONS = '.pdf,.pptx,.docx,.md,.markdown,.txt'

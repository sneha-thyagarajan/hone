/** All plain data types for the Hone database. */

export type FolderKind = 'theory' | 'coding' | 'mixed'

export interface Folder {
  id?: number
  name: string
  kind: FolderKind
  examDate?: string // ISO date string, e.g. "2026-11-13"
  createdAt: number // Date.now()
}

export type FileType =
  | 'note'
  | 'upload'
  | 'notes_ai'
  | 'flashcards'
  | 'quiz'
  | 'mock'
  | 'code'
  | 'plan'

export interface HoneFile {
  id?: number
  folderId: number
  type: FileType
  name: string
  /** Inline content (Markdown text, JSON for structured types) */
  content?: string
  /** Key into a separate blob store (for uploaded binary files – future) */
  blobId?: string
  /** Type-specific metadata (card count, question count, language, etc.) */
  meta?: Record<string, unknown>
  /** Source citations: [{ label, fileId, page }] */
  sources?: SourceRef[]
  createdAt: number
  updatedAt: number
}

export interface SourceRef {
  label: string
  fileId: number
  page?: number
}

export interface Chunk {
  id?: number
  fileId: number
  /** Human-readable label shown as citation, e.g. "Lecture 4 – Trees.pdf, p. 9" */
  source: string
  page?: number
  text: string
}

export interface Attempt {
  id?: number
  fileId: number
  /** "quiz" | "flashcard" | "mock" | "code" */
  kind: string
  score: number
  detail?: Record<string, unknown>
  at: number
}

export type CalEventKind = 'exam' | 'deadline' | 'study'

export interface CalEvent {
  id?: number
  folderId?: number
  title: string
  date: string // ISO date string
  kind: CalEventKind
}

export interface Task {
  id?: number
  folderId?: number
  title: string
  done: boolean
  date?: string // ISO date string
}

export interface Setting {
  key: string
  value: unknown
}

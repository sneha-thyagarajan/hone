import type { FolderKind } from '@/db/types'

/** AI agent output types (consumed by the agent panel once the AI layer exists). */
export type AiOutput = 'notes' | 'flashcards' | 'quiz' | 'mock' | 'plan' | 'code'

export interface AllowedTools {
  canUpload: boolean
  /** "Blank note" in the New file menu (standalone manual notes). */
  canNote: boolean
  canCode: boolean
  /** "Notes" filter tab in the folder workspace. */
  notesTab: boolean
  /** "Practice" filter tab in the folder workspace. */
  practiceTab: boolean
  aiOutputs: AiOutput[]
}

const BASE_AI: AiOutput[] = ['notes', 'flashcards', 'quiz', 'mock', 'plan']

/**
 * Single source of truth for what a folder offers based on its kind.
 *
 * - theory: notes, uploads, AI files; no code practice.
 * - coding: uploads, AI files, code practice; NO standalone notes (no Blank
 *   note item, no Notes filter tab).
 * - mixed: everything.
 *
 * Changing the kind never deletes files. Types no longer allowed stay visible
 * under the "All" filter; there's just no way to create new ones.
 */
export function getAllowedTools(kind: FolderKind): AllowedTools {
  const coding = kind === 'coding'
  const mixed = kind === 'mixed'
  const canCode = coding || mixed
  return {
    canUpload: true,
    canNote: !coding, // theory + mixed
    canCode,
    notesTab: !coding, // theory + mixed
    practiceTab: canCode,
    aiOutputs: canCode ? [...BASE_AI, 'code'] : BASE_AI,
  }
}

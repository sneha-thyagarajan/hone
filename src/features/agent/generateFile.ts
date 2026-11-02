import { db } from '@/db'
import type { HoneFile } from '@/db/types'
import { sampleCheatsheet, sampleFlashcards, sampleNotes, sampleQuiz } from '@/fixtures/aiSamples'
import { FlashcardsSchema, QuizSchema } from './schemas'
import { defaultFileName } from './sources'
import { TYPE_META, type AiOptions, type AiType } from './types'

export interface GenerateHooks {
  signal?: AbortSignal
  /** Dev-only: make the stub fail so the error state can be exercised. */
  simulateError?: boolean
}

/**
 * Generate an AI file from the given source files and save it in the folder.
 *
 * THIS IS A STUB. It waits ~1.5s and returns sample content from src/fixtures.
 * The teammate building the real AI pipeline should replace ONLY the marked
 * body below — the signature, saving, naming and the `isSample` flag stay.
 */
export async function generateFile(
  type: AiType,
  sourceFileIds: number[],
  options: AiOptions,
  hooks: GenerateHooks = {},
): Promise<HoneFile> {
  // ─── STUB BODY — replace with the real AI pipeline ──────────────────────
  await delay(1500, hooks.signal)
  if (hooks.simulateError) throw new Error('Generation failed (simulated).')

  let content: string
  if (type === 'quiz') content = JSON.stringify(QuizSchema.parse(sampleQuiz))
  else if (type === 'flashcards') content = JSON.stringify(FlashcardsSchema.parse(sampleFlashcards))
  else if (type === 'ai_notes') content = sampleNotes
  else content = sampleCheatsheet
  const isSample = true
  // ─── END STUB BODY ──────────────────────────────────────────────────────

  if (sourceFileIds.length === 0) throw new Error('Pick at least one source file')
  const first = await db.files.get(sourceFileIds[0])
  if (!first) throw new Error('Source file not found')
  const folderId = first.folderId
  const folder = await db.folders.get(folderId)

  const existing = (await db.files.where({ folderId }).toArray()).map((f) => f.name)
  const name = defaultFileName(type, folder?.name ?? 'Folder', existing)

  const now = Date.now()
  const id = await db.files.add({
    folderId,
    type: TYPE_META[type].fileType,
    name,
    content,
    meta: { sources: sourceFileIds, options, isSample },
    createdAt: now,
    updatedAt: now,
  })
  const saved = await db.files.get(id)
  return saved!
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'))
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(t)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
}

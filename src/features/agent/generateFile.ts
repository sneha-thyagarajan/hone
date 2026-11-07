import { db } from '@/db'
import type { HoneFile } from '@/db/types'
import { buildClientFromSettings, MockLlmClient, truncateSectionsToFit } from '@/ai'
import type { LlmClient } from '@/ai'
import { FlashcardsSchema, MarkdownContentSchema, QuizSchema } from './schemas'
import { buildPrompt } from './prompts'
import { defaultFileName } from './sources'
import { TYPE_META, type AiOptions, type AiType } from './types'

// ─── Types ────────────────────────────────────────────────────────────────────

/** A labelled piece of text drawn from a source file. Passed to generateContent. */
export interface Section {
  fileId: number
  fileName: string
  page?: number
  text: string
}

/** Raw generation result before it is saved to the database. */
export interface ContentResult {
  content: string
  /** True when this came from MockLlmClient rather than a real model call. */
  isSample: boolean
}

export interface GenerateHooks {
  signal?: AbortSignal
  /** Dev-only: throw before the LLM call so the error UI can be exercised. */
  simulateError?: boolean
}

// ─── generateContent ──────────────────────────────────────────────────────────

/**
 * Generate content for an AI file from the given sections using the provided client.
 *
 * - Pure with respect to the database — all DB work happens in the callers.
 * - Pass MockLlmClient to get instant sample output (no network, no Ollama needed).
 * - Pass OpenAiCompatibleClient to call a real model.
 */
export async function generateContent(
  type: AiType,
  sections: Section[],
  options: AiOptions,
  client: LlmClient,
  hooks: GenerateHooks = {},
): Promise<ContentResult> {
  if (hooks.signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  if (hooks.simulateError) throw new Error('Generation failed (simulated).')

  // Guard: refuse to call the LLM with empty source material
  const totalChars = sections.reduce((sum, s) => sum + s.text.length, 0)
  if (!(client instanceof MockLlmClient) && totalChars === 0) {
    throw new Error(
      'No readable text found in the selected files. ' +
      'Add content to your note, or use a note instead of a PDF (PDF text extraction is not yet supported).',
    )
  }

  const isSample = client instanceof MockLlmClient

  // Build the prompt once to learn the output budget, then truncate sections if needed
  const draftPrompt = buildPrompt(type, sections, options)
  const fittedSections = truncateSectionsToFit(sections, client.capabilities, draftPrompt.maxOutputTokens)
  const { system, user, maxOutputTokens } = buildPrompt(type, fittedSections, options)

  if (type === 'quiz') {
    const { data } = await client.generateJson({
      system, user, schema: QuizSchema, maxOutputTokens, signal: hooks.signal,
    })
    return { content: JSON.stringify(data), isSample }
  }

  if (type === 'flashcards') {
    const { data } = await client.generateJson({
      system, user, schema: FlashcardsSchema, maxOutputTokens, signal: hooks.signal,
    })
    return { content: JSON.stringify(data), isSample }
  }

  // ai_notes, cheatsheet: model wraps Markdown in a JSON envelope
  const { data } = await client.generateJson({
    system, user, schema: MarkdownContentSchema, maxOutputTokens, signal: hooks.signal,
  })
  return { content: data.content, isSample }
}

// ─── saveGeneratedFile ────────────────────────────────────────────────────────

/**
 * Persist a ContentResult to the database as a named HoneFile.
 * Resolves the folder from the first source file and avoids duplicate names.
 */
export async function saveGeneratedFile(
  type: AiType,
  result: ContentResult,
  sourceFileIds: number[],
  options: AiOptions,
): Promise<HoneFile> {
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
    content: result.content,
    meta: { sources: sourceFileIds, options, isSample: result.isSample },
    createdAt: now,
    updatedAt: now,
  })
  return (await db.files.get(id))!
}

// ─── generateFile ─────────────────────────────────────────────────────────────

/**
 * Generate an AI file from source file IDs and save it.
 * Reads the configured provider from IndexedDB, builds a client,
 * then composes generateContent + saveGeneratedFile.
 */
export async function generateFile(
  type: AiType,
  sourceFileIds: number[],
  options: AiOptions,
  hooks: GenerateHooks = {},
): Promise<HoneFile> {
  if (sourceFileIds.length === 0) throw new Error('Pick at least one source file')

  const [client, sourceFiles] = await Promise.all([
    buildClientFromSettings(),
    Promise.all(sourceFileIds.map((id) => db.files.get(id))),
  ])

  const sections: Section[] = sourceFiles
    .filter((f): f is HoneFile => f !== undefined)
    .map((f) => ({ fileId: f.id!, fileName: f.name, text: f.content ?? '' }))

  const result = await generateContent(type, sections, options, client, hooks)
  return saveGeneratedFile(type, result, sourceFileIds, options)
}

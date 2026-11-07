import { z } from 'zod'

/**
 * Minimal content schemas for AI-generated quiz and flashcards files.
 *
 * NOTE: docs/data-contract.md did not exist when this was written, so these are
 * provisional — see docs/data-contract.md, which now documents them. Confirm
 * the shape with the teammate building the real AI pipeline before relying on it.
 *
 * z.preprocess normalises common alternative key names that Ollama models tend to
 * produce instead of the key names we specify in the prompt.
 */

const QuizItem = z.object({
  question: z.string(),
  options: z.array(z.string()).min(2),
  answerIndex: z.number().int().min(0),
  explanation: z.string(),
})

export const QuizSchema = z.preprocess((v) => {
  if (typeof v !== 'object' || v === null) return v
  const obj = v as Record<string, unknown>
  // Remap common alternative top-level keys
  if (!obj.questions) {
    const alt = obj.quiz ?? obj.quiz_questions ?? obj.data ?? obj.items
    if (Array.isArray(alt)) return { questions: alt }
  }
  return v
}, z.object({ questions: z.array(QuizItem).min(1) }))

const CardItem = z.object({
  front: z.string(),
  back: z.string(),
})

export const FlashcardsSchema = z.preprocess((v) => {
  if (typeof v !== 'object' || v === null) return v
  const obj = v as Record<string, unknown>
  // Remap common alternative top-level keys
  if (!obj.cards) {
    const alt = obj.flashcards ?? obj.card_list ?? obj.data ?? obj.items
    if (Array.isArray(alt)) return { cards: alt }
    if (Array.isArray(v)) return { cards: v }
  }
  return v
}, z.object({ cards: z.array(CardItem).min(1) }))

/** Schema for ai_notes and cheatsheet — model wraps Markdown in a JSON envelope. */
export const MarkdownContentSchema = z.preprocess((v) => {
  if (typeof v !== 'object' || v === null) return v
  const obj = v as Record<string, unknown>
  if (!obj.content) {
    const alt = obj.markdown ?? obj.text ?? obj.notes ?? obj.cheatsheet ?? obj.output
    if (typeof alt === 'string') return { content: alt }
  }
  return v
}, z.object({ content: z.string().min(1) }))

export type Quiz = z.infer<typeof QuizSchema>
export type Flashcards = z.infer<typeof FlashcardsSchema>
export type MarkdownContent = z.infer<typeof MarkdownContentSchema>

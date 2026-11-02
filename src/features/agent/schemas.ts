import { z } from 'zod'

/**
 * Minimal content schemas for AI-generated quiz and flashcards files.
 *
 * NOTE: docs/data-contract.md did not exist when this was written, so these are
 * provisional — see docs/data-contract.md, which now documents them. Confirm
 * the shape with the teammate building the real AI pipeline before relying on it.
 */

export const QuizSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string(),
        options: z.array(z.string()).min(2),
        answerIndex: z.number().int().min(0),
        explanation: z.string(),
      }),
    )
    .min(1),
})

export const FlashcardsSchema = z.object({
  cards: z
    .array(
      z.object({
        front: z.string(),
        back: z.string(),
      }),
    )
    .min(1),
})

export type Quiz = z.infer<typeof QuizSchema>
export type Flashcards = z.infer<typeof FlashcardsSchema>

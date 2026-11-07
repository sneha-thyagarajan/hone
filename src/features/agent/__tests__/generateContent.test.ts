import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { MockLlmClient } from '@/ai/mock'
import { generateContent, type Section } from '../generateFile'

const mockClient = new MockLlmClient()

const QuizSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()).min(2),
      answerIndex: z.number().int().min(0),
      explanation: z.string(),
    }),
  ).min(1),
})

const FlashcardsSchema = z.object({
  cards: z.array(z.object({ front: z.string(), back: z.string() })).min(1),
})

const sections: Section[] = [
  { fileId: 1, fileName: 'Heaps.md', text: '# Heaps\n\nA heap is a complete binary tree.' },
]

describe('generateContent (MockLlmClient)', () => {
  it('returns valid quiz JSON and marks it as a sample', async () => {
    const result = await generateContent('quiz', sections, { count: 5, difficulty: 'easy' }, mockClient)
    expect(result.isSample).toBe(true)
    expect(() => QuizSchema.parse(JSON.parse(result.content))).not.toThrow()
  })

  it('returns valid flashcards JSON', async () => {
    const result = await generateContent('flashcards', sections, { count: 10, focus: 'terms' }, mockClient)
    expect(result.isSample).toBe(true)
    expect(() => FlashcardsSchema.parse(JSON.parse(result.content))).not.toThrow()
  })

  it('returns a markdown string for ai_notes', async () => {
    const result = await generateContent('ai_notes', sections, { length: 'standard' }, mockClient)
    expect(result.isSample).toBe(true)
    expect(typeof result.content).toBe('string')
    expect(result.content.startsWith('#')).toBe(true)
  })

  it('returns a markdown string for cheatsheet', async () => {
    const result = await generateContent('cheatsheet', sections, { density: 'compact' }, mockClient)
    expect(result.isSample).toBe(true)
    expect(typeof result.content).toBe('string')
  })

  it('throws when simulateError hook is set', async () => {
    await expect(
      generateContent('quiz', sections, {}, mockClient, { simulateError: true }),
    ).rejects.toThrow(/simulated/i)
  })

  it('throws when the client is configured to error', async () => {
    const errorClient = new MockLlmClient({ simulateError: true, errorMessage: 'LLM unreachable' })
    await expect(
      generateContent('quiz', sections, {}, errorClient),
    ).rejects.toThrow(/unreachable/i)
  })

  it('throws when AbortSignal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(
      generateContent('quiz', sections, {}, mockClient, { signal: controller.signal }),
    ).rejects.toThrow(/aborted/i)
  })

  it('throws when AbortSignal fires during the call', async () => {
    const slowClient = new MockLlmClient({ delayMs: 300 })
    const controller = new AbortController()
    const promise = generateContent('quiz', sections, {}, slowClient, { signal: controller.signal })
    controller.abort()
    await expect(promise).rejects.toThrow(/aborted/i)
  })

  it('works with an empty sections array', async () => {
    const result = await generateContent('flashcards', [], { count: 10 }, mockClient)
    expect(result.isSample).toBe(true)
    expect(() => FlashcardsSchema.parse(JSON.parse(result.content))).not.toThrow()
  })
})

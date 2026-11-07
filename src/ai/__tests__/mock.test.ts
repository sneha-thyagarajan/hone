import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { LlmError } from '../provider'
import { MockLlmClient } from '../mock'

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
  cards: z.array(
    z.object({
      front: z.string(),
      back: z.string(),
    }),
  ).min(1),
})

describe('MockLlmClient.generateJson', () => {
  it('returns valid quiz data for a quiz schema', async () => {
    const client = new MockLlmClient()
    const { data } = await client.generateJson({
      system: 'Generate a quiz.',
      user: 'Material: heaps',
      schema: QuizSchema,
    })
    expect(QuizSchema.safeParse(data).success).toBe(true)
    expect(data.questions.length).toBeGreaterThan(0)
  })

  it('returns valid flashcard data for a flashcards schema', async () => {
    const client = new MockLlmClient()
    const { data } = await client.generateJson({
      system: 'Generate flashcards.',
      user: 'Material: heaps',
      schema: FlashcardsSchema,
    })
    expect(FlashcardsSchema.safeParse(data).success).toBe(true)
    expect(data.cards.length).toBeGreaterThan(0)
  })

  it('returns a string for a string schema (markdown output)', async () => {
    const client = new MockLlmClient()
    const { data } = await client.generateJson({
      system: 'Summarise.',
      user: 'Material: heaps',
      schema: z.string().min(1),
    })
    expect(typeof data).toBe('string')
    expect(data.length).toBeGreaterThan(0)
  })

  it('includes usage stats', async () => {
    const client = new MockLlmClient()
    const result = await client.generateJson({
      system: 's', user: 'u', schema: FlashcardsSchema,
    })
    expect(result.usage).toMatchObject({
      promptTokens: expect.any(Number),
      completionTokens: expect.any(Number),
    })
  })

  it('returns fixedResponse when configured', async () => {
    const fixed = { questions: [{ question: 'Q', options: ['A', 'B'], answerIndex: 0, explanation: 'E' }] }
    const client = new MockLlmClient({ fixedResponse: fixed })
    const { data } = await client.generateJson({ system: 's', user: 'u', schema: QuizSchema })
    expect(data).toEqual(fixed)
  })

  it('throws bad-json when fixedResponse does not match schema', async () => {
    const client = new MockLlmClient({ fixedResponse: { wrong: true } })
    await expect(
      client.generateJson({ system: 's', user: 'u', schema: QuizSchema }),
    ).rejects.toMatchObject({ type: 'bad-json' })
  })

  it('throws LlmError when simulateError is true', async () => {
    const client = new MockLlmClient({ simulateError: true, errorType: 'timeout', errorMessage: 'Timed out' })
    const err = await client.generateJson({ system: 's', user: 'u', schema: QuizSchema }).catch((e) => e)
    expect(err).toBeInstanceOf(LlmError)
    expect(err.type).toBe('timeout')
    expect(err.message).toBe('Timed out')
  })

  it('throws aborted when signal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    const client = new MockLlmClient()
    await expect(
      client.generateJson({ system: 's', user: 'u', schema: QuizSchema, signal: controller.signal }),
    ).rejects.toMatchObject({ type: 'aborted' })
  })

  it('throws aborted when signal fires during delay', async () => {
    const controller = new AbortController()
    const client = new MockLlmClient({ delayMs: 5000 })
    const promise = client.generateJson({
      system: 's', user: 'u', schema: QuizSchema, signal: controller.signal,
    })
    controller.abort()
    await expect(promise).rejects.toMatchObject({ type: 'aborted' })
  })

  it('throws bad-json when no schema matches and no fixedResponse', async () => {
    const client = new MockLlmClient()
    const strangeSchema = z.object({ xyzUnique: z.number() })
    await expect(
      client.generateJson({ system: 's', user: 'u', schema: strangeSchema }),
    ).rejects.toMatchObject({ type: 'bad-json' })
  })
})

describe('MockLlmClient.checkHealth', () => {
  it('returns ok:true by default', async () => {
    const client = new MockLlmClient()
    const result = await client.checkHealth()
    expect(result).toMatchObject({ ok: true, model: 'mock' })
  })

  it('returns ok:false when simulateError is set', async () => {
    const client = new MockLlmClient({ simulateError: true, errorMessage: 'Down' })
    const result = await client.checkHealth()
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('Down')
      expect(result.step).toBe('reachable')
      expect(typeof result.hint).toBe('string')
    }
  })
})

describe('MockLlmClient.listModels', () => {
  it('returns ["mock"]', async () => {
    const client = new MockLlmClient()
    expect(await client.listModels()).toEqual(['mock'])
  })
})

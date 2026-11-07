import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { z } from 'zod'
import { LlmError } from '../provider'
import { OpenAiCompatibleClient } from '../openaiCompatible'

// ─── MSW server ───────────────────────────────────────────────────────────────

const BASE = 'http://localhost:11434/v1'

function chatResponse(content: string, usage = { prompt_tokens: 10, completion_tokens: 5 }) {
  return HttpResponse.json({
    choices: [{ message: { content } }],
    usage,
  })
}

const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function makeClient(overrides: Partial<ConstructorParameters<typeof OpenAiCompatibleClient>[0]> = {}) {
  return new OpenAiCompatibleClient({ baseUrl: BASE, model: 'qwen2.5:7b', ...overrides })
}

// ─── generateJson ─────────────────────────────────────────────────────────────

const FlashcardsSchema = z.object({
  cards: z.array(z.object({ front: z.string(), back: z.string() })).min(1),
})

describe('OpenAiCompatibleClient.generateJson', () => {
  it('parses a valid response and validates with Zod', async () => {
    const payload = { cards: [{ front: 'Q', back: 'A' }] }
    server.use(http.post(`${BASE}/chat/completions`, () => chatResponse(JSON.stringify(payload))))

    const client = makeClient()
    const { data, usage } = await client.generateJson({ system: 's', user: 'u', schema: FlashcardsSchema })
    expect(data).toEqual(payload)
    expect(usage).toMatchObject({ promptTokens: 10, completionTokens: 5 })
  })

  it('sends Authorization header when apiKey is configured', async () => {
    let captured: string | null = null
    server.use(
      http.post(`${BASE}/chat/completions`, ({ request }) => {
        captured = request.headers.get('Authorization')
        return chatResponse(JSON.stringify({ cards: [{ front: 'Q', back: 'A' }] }))
      }),
    )
    await makeClient({ apiKey: 'sk-test' }).generateJson({
      system: 's', user: 'u', schema: FlashcardsSchema,
    })
    expect(captured).toBe('Bearer sk-test')
  })

  it('sends response_format json_object', async () => {
    let body: Record<string, unknown> = {}
    server.use(
      http.post(`${BASE}/chat/completions`, async ({ request }) => {
        body = await request.json() as Record<string, unknown>
        return chatResponse(JSON.stringify({ cards: [{ front: 'Q', back: 'A' }] }))
      }),
    )
    await makeClient().generateJson({ system: 's', user: 'u', schema: FlashcardsSchema })
    expect(body.response_format).toEqual({ type: 'json_object' })
  })

  it('throws bad-json when response content is not valid JSON', async () => {
    server.use(http.post(`${BASE}/chat/completions`, () => chatResponse('not json at all')))
    await expect(makeClient().generateJson({ system: 's', user: 'u', schema: FlashcardsSchema }))
      .rejects.toMatchObject({ type: 'bad-json' })
  })

  it('throws bad-json when JSON does not match schema', async () => {
    server.use(http.post(`${BASE}/chat/completions`, () => chatResponse('{"wrong":true}')))
    await expect(makeClient().generateJson({ system: 's', user: 'u', schema: FlashcardsSchema }))
      .rejects.toMatchObject({ type: 'bad-json' })
  })

  it('throws bad-json when choices is missing', async () => {
    server.use(http.post(`${BASE}/chat/completions`, () => HttpResponse.json({ choices: [] })))
    await expect(makeClient().generateJson({ system: 's', user: 'u', schema: FlashcardsSchema }))
      .rejects.toMatchObject({ type: 'bad-json' })
  })

  it('throws unauthorized on 401', async () => {
    server.use(http.post(`${BASE}/chat/completions`, () => new HttpResponse(null, { status: 401 })))
    await expect(makeClient().generateJson({ system: 's', user: 'u', schema: FlashcardsSchema }))
      .rejects.toMatchObject({ type: 'unauthorized' })
  })

  it('throws unauthorized on 403', async () => {
    server.use(http.post(`${BASE}/chat/completions`, () => new HttpResponse(null, { status: 403 })))
    await expect(makeClient().generateJson({ system: 's', user: 'u', schema: FlashcardsSchema }))
      .rejects.toMatchObject({ type: 'unauthorized' })
  })

  it('throws model-not-found on 404', async () => {
    server.use(http.post(`${BASE}/chat/completions`, () => new HttpResponse(null, { status: 404 })))
    await expect(makeClient().generateJson({ system: 's', user: 'u', schema: FlashcardsSchema }))
      .rejects.toMatchObject({ type: 'model-not-found' })
  })

  it('throws unknown on unexpected status', async () => {
    server.use(http.post(`${BASE}/chat/completions`, () => new HttpResponse('oops', { status: 500 })))
    await expect(makeClient().generateJson({ system: 's', user: 'u', schema: FlashcardsSchema }))
      .rejects.toMatchObject({ type: 'unknown' })
  })

  it('throws aborted when the caller signal fires', async () => {
    const controller = new AbortController()
    server.use(
      http.post(`${BASE}/chat/completions`, async () => {
        // simulate slow response
        await new Promise((r) => setTimeout(r, 2000))
        return chatResponse('{}')
      }),
    )
    const promise = makeClient().generateJson({
      system: 's', user: 'u', schema: FlashcardsSchema, signal: controller.signal,
    })
    controller.abort()
    const err = await promise.catch((e) => e)
    expect(err).toBeInstanceOf(LlmError)
    expect(err.type).toBe('aborted')
  })

  it('throws unreachable when fetch fails entirely', async () => {
    server.use(
      http.post(`${BASE}/chat/completions`, () => HttpResponse.error()),
    )
    const err = await makeClient().generateJson({
      system: 's', user: 'u', schema: FlashcardsSchema,
    }).catch((e) => e)
    expect(err).toBeInstanceOf(LlmError)
    expect(err.type).toBe('unreachable')
  })
})

// ─── checkHealth ──────────────────────────────────────────────────────────────

const modelsList = { data: [{ id: 'qwen2.5:7b' }, { id: 'llama3.2' }] }

describe('OpenAiCompatibleClient.checkHealth', () => {
  it('returns ok:true when all three steps pass', async () => {
    server.use(
      http.get(`${BASE}/models`, () => HttpResponse.json(modelsList)),
      http.post(`${BASE}/chat/completions`, () => chatResponse('{"ok":true}')),
    )
    const result = await makeClient().checkHealth()
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.model).toBe('qwen2.5:7b')
      expect(result.latencyMs).toBeGreaterThanOrEqual(0)
    }
  })

  it('returns step:reachable when the server is unreachable', async () => {
    server.use(
      http.get(`${BASE}/models`, () => HttpResponse.error()),
    )
    const result = await makeClient().checkHealth()
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.step).toBe('reachable')
      expect(typeof result.hint).toBe('string')
    }
  })

  it('returns step:model when the configured model is not in the list', async () => {
    server.use(
      http.get(`${BASE}/models`, () => HttpResponse.json({ data: [{ id: 'llama3.2' }] })),
    )
    const result = await makeClient().checkHealth()
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.step).toBe('model')
      expect(result.hint).toMatch(/ollama pull qwen2.5:7b/)
    }
  })

  it('returns step:generate when generation fails', async () => {
    server.use(
      http.get(`${BASE}/models`, () => HttpResponse.json(modelsList)),
      http.post(`${BASE}/chat/completions`, () => new HttpResponse(null, { status: 500 })),
    )
    const result = await makeClient().checkHealth()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.step).toBe('generate')
  })

  it('skips model check and proceeds to generation when /models returns non-standard shape', async () => {
    server.use(
      http.get(`${BASE}/models`, () => HttpResponse.json({ models: [] })), // Ollama native shape
      http.post(`${BASE}/chat/completions`, () => chatResponse('{"ok":true}')),
    )
    const result = await makeClient().checkHealth()
    expect(result.ok).toBe(true)
  })
})

// ─── listModels ───────────────────────────────────────────────────────────────

describe('OpenAiCompatibleClient.listModels', () => {
  it('returns model ids from /v1/models', async () => {
    server.use(http.get(`${BASE}/models`, () => HttpResponse.json(modelsList)))
    const models = await makeClient().listModels()
    expect(models).toEqual(['qwen2.5:7b', 'llama3.2'])
  })

  it('returns [] when the request fails', async () => {
    server.use(http.get(`${BASE}/models`, () => { throw new TypeError('Failed to fetch') }))
    const models = await makeClient().listModels()
    expect(models).toEqual([])
  })
})

import { LlmError, type GenerateJsonResult, type HealthResult, type LlmCapabilities, type LlmClient, type GenerateJsonRequest } from './provider'

// ─── Configuration ────────────────────────────────────────────────────────────

export interface OpenAiCompatibleConfig {
  /** Base URL of the API, e.g. "http://localhost:11434/v1" or "https://api.openai.com/v1". */
  baseUrl: string
  /** Model name, e.g. "qwen2.5:7b" or "gpt-4o-mini". */
  model: string
  /** API key sent as "Authorization: Bearer <key>". Optional for local providers. */
  apiKey?: string
  /**
   * Request timeout in ms. Default: 30_000.
   * The first Ollama request is slow (model load) — set this generously.
   */
  timeoutMs?: number
  /**
   * Effective context window in tokens. Default: 8192.
   * Ollama defaults to 4096 — set this explicitly or override OLLAMA_CONTEXT_LENGTH.
   * The native Ollama adapter (issue #19) can set num_ctx per request.
   */
  maxContextTokens?: number
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class OpenAiCompatibleClient implements LlmClient {
  readonly capabilities: LlmCapabilities
  private readonly config: OpenAiCompatibleConfig
  private readonly origin: string
  private readonly timeoutMs: number

  constructor(config: OpenAiCompatibleConfig) {
    this.config = config
    this.origin = config.baseUrl.replace(/\/+$/, '')
    this.timeoutMs = config.timeoutMs ?? 30_000
    this.capabilities = {
      maxContextTokens: config.maxContextTokens ?? 8192,
      // Always false: Ollama /v1 doesn't support json_schema mode.
      // We rely on Zod validation after every call regardless.
      structuredOutput: false,
    }
  }

  async generateJson<T>(req: GenerateJsonRequest<T>): Promise<GenerateJsonResult<T>> {
    const { system, user, schema, maxOutputTokens, signal } = req

    const body: Record<string, unknown> = {
      model: this.config.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      ...(maxOutputTokens !== undefined && { max_tokens: maxOutputTokens }),
    }

    if (import.meta.env.DEV) {
      console.group('[Hone AI] generateJson →', this.config.model)
      console.log('system:', system)
      console.log('user (first 500 chars):', user.slice(0, 500))
      console.log('maxOutputTokens:', maxOutputTokens)
      console.groupEnd()
    }

    const abort = combineSignals(signal, this.timeoutMs)
    let resp: Response
    try {
      resp = await fetch(`${this.origin}/chat/completions`, {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify(body),
        signal: abort.signal,
      })
    } catch (err) {
      abort.clear()
      throw this.networkError(err, signal)
    }
    abort.clear()

    await this.assertResponseOk(resp)

    const json = await resp.json() as {
      choices?: { message?: { content?: string } }[]
      usage?: { prompt_tokens?: number; completion_tokens?: number }
    }
    const content = json.choices?.[0]?.message?.content
    if (typeof content !== 'string') {
      throw new LlmError('bad-json', 'Unexpected response shape: missing choices[0].message.content')
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch {
      throw new LlmError('bad-json', `Response was not valid JSON: ${content.slice(0, 200)}`)
    }

    const result = schema.safeParse(parsed)
    if (!result.success) {
      if (import.meta.env.DEV) {
        console.warn('[Hone AI] schema validation failed. Raw response:', content)
      }
      throw new LlmError('bad-json', `Response did not match expected schema: ${result.error.message}`)
    }

    return {
      data: result.data,
      usage: json.usage
        ? { promptTokens: json.usage.prompt_tokens ?? 0, completionTokens: json.usage.completion_tokens ?? 0 }
        : undefined,
    }
  }

  async checkHealth(): Promise<HealthResult> {
    const t0 = Date.now()

    // Step 1 — reachable? /v1/models is standard for OpenAI-compatible APIs.
    let modelsResp: Response
    try {
      modelsResp = await fetch(`${this.origin}/models`, {
        headers: this.authHeaders(),
        signal: AbortSignal.timeout(5_000),
      })
    } catch {
      return {
        ok: false,
        step: 'reachable',
        error: `Could not reach ${this.origin}`,
        hint: [
          'Check that the server is running (e.g. `ollama serve`).',
          'If the page is served over HTTPS, a plain http:// provider is blocked (mixed content).',
          'CORS errors and network errors look identical in the browser — open DevTools for details.',
        ].join(' '),
      }
    }

    // Step 2 — model installed?
    if (modelsResp.ok) {
      try {
        const body = await modelsResp.json() as { data?: { id: string }[] }
        const ids = body.data?.map((m) => m.id) ?? []
        if (ids.length > 0 && !ids.includes(this.config.model)) {
          return {
            ok: false,
            step: 'model',
            error: `Model "${this.config.model}" is not available on this server.`,
            hint: `Run: ollama pull ${this.config.model}  (available: ${ids.slice(0, 5).join(', ')})`,
          }
        }
      } catch {
        // Non-standard model list shape — skip this step
      }
    }

    // Step 3 — test generation
    try {
      const { z } = await import('zod')
      await this.generateJson({
        system: 'Reply with only valid JSON and nothing else.',
        user: '{"ok":true}',
        schema: z.object({ ok: z.literal(true) }),
        maxOutputTokens: 20,
        signal: AbortSignal.timeout(15_000),
      })
    } catch (err) {
      return {
        ok: false,
        step: 'generate',
        error: err instanceof Error ? err.message : String(err),
        hint: 'The first request can be slow while the model loads — try again in a moment.',
      }
    }

    return { ok: true, model: this.config.model, latencyMs: Date.now() - t0 }
  }

  listModels(): Promise<string[]> {
    return fetch(`${this.origin}/models`, { headers: this.authHeaders() })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((body: { data?: { id: string }[] }) => body.data?.map((m) => m.id) ?? [])
      .catch(() => [])
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private authHeaders(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' }
    if (this.config.apiKey) h['Authorization'] = `Bearer ${this.config.apiKey}`
    return h
  }

  private networkError(err: unknown, callerSignal?: AbortSignal): LlmError {
    const name = (err as Error)?.name
    if (name === 'AbortError' || name === 'TimeoutError') {
      if (callerSignal?.aborted) return new LlmError('aborted', 'Aborted by caller', err)
      return new LlmError('timeout', `Request timed out after ${this.timeoutMs}ms`, err)
    }
    return new LlmError(
      'unreachable',
      `Could not reach ${this.origin}. Check: server running, no CORS block, no mixed-content issue.`,
      err,
    )
  }

  private async assertResponseOk(resp: Response): Promise<void> {
    if (resp.ok) return
    const body = await resp.text().catch(() => '')
    if (resp.status === 401 || resp.status === 403) {
      throw new LlmError('unauthorized', 'Invalid or missing API key.')
    }
    if (resp.status === 404) {
      throw new LlmError(
        'model-not-found',
        `Model "${this.config.model}" not found (404). For Ollama, run: ollama pull ${this.config.model}`,
      )
    }
    throw new LlmError('unknown', `Server returned ${resp.status}: ${body.slice(0, 200)}`)
  }
}

// ─── Signal helpers ───────────────────────────────────────────────────────────

function combineSignals(userSignal: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(new DOMException('Timeout', 'TimeoutError')), timeoutMs)
  const onAbort = () => controller.abort(userSignal?.reason)
  userSignal?.addEventListener('abort', onAbort, { once: true })

  const combined = userSignal
    ? (AbortSignal.any?.([controller.signal, userSignal]) ?? controller.signal)
    : controller.signal

  return {
    signal: combined,
    clear() {
      clearTimeout(timer)
      userSignal?.removeEventListener('abort', onAbort)
    },
  }
}

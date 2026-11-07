import type { ZodType } from 'zod'

// ─── Error types ──────────────────────────────────────────────────────────────

export type LlmErrorType =
  | 'unreachable'     // network failure, CORS, mixed-content
  | 'unauthorized'    // 401 / 403
  | 'model-not-found' // 404, model not installed
  | 'bad-json'        // response couldn't be parsed or failed Zod validation
  | 'timeout'         // request exceeded timeoutMs
  | 'aborted'         // AbortSignal fired by the caller
  | 'unknown'

export class LlmError extends Error {
  readonly type: LlmErrorType
  readonly cause: unknown
  constructor(type: LlmErrorType, message: string, cause?: unknown) {
    super(message)
    this.name = 'LlmError'
    this.type = type
    this.cause = cause
  }
}

// ─── Supporting types ─────────────────────────────────────────────────────────

export interface Usage {
  promptTokens: number
  completionTokens: number
}

/** Result of LlmClient.checkHealth(). */
export type HealthResult =
  | { ok: true; model: string; latencyMs: number }
  | { ok: false; step: 'reachable' | 'model' | 'generate'; error: string; hint: string }

export interface LlmCapabilities {
  /** Effective context window in tokens. May be lower than the model's advertised max. */
  maxContextTokens: number
  /**
   * Whether this provider enforces the output schema natively (e.g. OpenAI json_schema mode).
   * Always validate with Zod regardless — this flag only controls which request format is used.
   */
  structuredOutput: boolean
}

// ─── Request / response ───────────────────────────────────────────────────────

export interface GenerateJsonRequest<T> {
  system: string
  user: string
  /** Zod schema that the response must satisfy. Validated after every call. */
  schema: ZodType<T>
  maxOutputTokens?: number
  signal?: AbortSignal
}

export interface GenerateJsonResult<T> {
  data: T
  usage?: Usage
}

// ─── Client interface ─────────────────────────────────────────────────────────

export interface LlmClient {
  readonly capabilities: LlmCapabilities

  /**
   * Generate a structured JSON response and validate it against `schema`.
   * Throws LlmError on any failure.
   */
  generateJson<T>(req: GenerateJsonRequest<T>): Promise<GenerateJsonResult<T>>

  /**
   * Three-step health check: reachable → model installed → test generation.
   * Returns a detailed failure with an actionable hint when a step fails.
   */
  checkHealth(): Promise<HealthResult>

  /** Optional: list models available on this provider. */
  listModels?(): Promise<string[]>
}

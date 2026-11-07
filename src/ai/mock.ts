import { LlmError, type GenerateJsonResult, type HealthResult, type LlmCapabilities, type LlmClient, type GenerateJsonRequest } from './provider'

// ─── Built-in sample responses ────────────────────────────────────────────────
// These mirror the shapes in src/features/agent/schemas.ts without importing them.
// Evidence fields are intentionally absent — issue #11 adds them.

const QUIZ_SAMPLE = {
  questions: [
    {
      question: 'What property defines a max-heap?',
      options: [
        'Every parent is greater than or equal to its children',
        'Every parent is less than or equal to its children',
        'All leaves are at the same depth',
        'The tree is always balanced',
      ],
      answerIndex: 0,
      explanation: 'In a max-heap every node is ≥ its children, so the largest element is always at the root.',
    },
  ],
}

const FLASHCARDS_SAMPLE = {
  cards: [
    {
      front: 'What is a heap?',
      back: 'A complete binary tree satisfying the heap property: each parent is ≥ (max-heap) or ≤ (min-heap) its children.',
    },
  ],
}

const MARKDOWN_SAMPLE = '# Notes\n\nKey concepts from the selected material.'

const CONTENT_WRAPPER_SAMPLE = {
  content: '# Notes\n\n## Key concepts\n\nKey concepts from the selected material.\n\n- Term A: definition\n- Term B: definition',
}

const CANDIDATES: unknown[] = [QUIZ_SAMPLE, FLASHCARDS_SAMPLE, CONTENT_WRAPPER_SAMPLE]

// ─── Config ───────────────────────────────────────────────────────────────────

export interface MockConfig {
  /** Artificial delay in ms. Default: 0 (instant). */
  delayMs?: number
  /**
   * When true, generateJson throws an LlmError instead of returning data.
   * checkHealth returns an error result.
   */
  simulateError?: boolean
  /** Error type thrown when simulateError is true. Default: 'unknown'. */
  errorType?: LlmError['type']
  /** Error message when simulateError is true. */
  errorMessage?: string
  /**
   * Override the automatic sample selection with a fixed response object.
   * Must be valid for the schema passed to generateJson, or the call will throw.
   */
  fixedResponse?: unknown
}

// ─── Mock client ──────────────────────────────────────────────────────────────

export class MockLlmClient implements LlmClient {
  readonly capabilities: LlmCapabilities = {
    maxContextTokens: 8192,
    structuredOutput: false,
  }

  private readonly config: MockConfig

  constructor(config: MockConfig = {}) {
    this.config = config
  }

  async generateJson<T>(req: GenerateJsonRequest<T>): Promise<GenerateJsonResult<T>> {
    if (req.signal?.aborted) throw new LlmError('aborted', 'Aborted')

    await mockDelay(this.config.delayMs ?? 0, req.signal)

    if (this.config.simulateError) {
      throw new LlmError(
        this.config.errorType ?? 'unknown',
        this.config.errorMessage ?? 'Mock error (simulated)',
      )
    }

    // Fixed override takes precedence
    if (this.config.fixedResponse !== undefined) {
      const result = req.schema.safeParse(this.config.fixedResponse)
      if (!result.success) {
        throw new LlmError('bad-json', `Fixed response did not match schema: ${result.error.message}`)
      }
      return { data: result.data, usage: { promptTokens: 50, completionTokens: 20 } }
    }

    // Auto-detect: try each candidate against the schema, pick the first that validates
    for (const candidate of CANDIDATES) {
      const result = req.schema.safeParse(candidate)
      if (result.success) {
        return { data: result.data, usage: { promptTokens: 100, completionTokens: 50 } }
      }
    }

    // Fall back to the markdown string
    const strResult = req.schema.safeParse(MARKDOWN_SAMPLE)
    if (strResult.success) {
      return { data: strResult.data, usage: { promptTokens: 100, completionTokens: 80 } }
    }

    throw new LlmError('bad-json', 'MockLlmClient has no built-in sample that satisfies this schema. Pass fixedResponse in MockConfig.')
  }

  async checkHealth(): Promise<HealthResult> {
    if (this.config.simulateError) {
      return {
        ok: false,
        step: 'reachable',
        error: this.config.errorMessage ?? 'Mock error (simulated)',
        hint: 'This is a simulated error from MockLlmClient.',
      }
    }
    return { ok: true, model: 'mock', latencyMs: 0 }
  }

  listModels(): Promise<string[]> {
    return Promise.resolve(['mock'])
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockDelay(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve()
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new LlmError('aborted', 'Aborted'))
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(t)
      reject(new LlmError('aborted', 'Aborted'))
    })
  })
}

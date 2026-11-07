import { db } from '@/db'
import { MockLlmClient } from './mock'
import { OpenAiCompatibleClient } from './openaiCompatible'
import type { LlmClient } from './provider'

async function getSetting(key: string, fallback: string): Promise<string> {
  const row = await db.settings.get(key)
  return row ? (row.value as string) : fallback
}

// Ollama defaults to a 4096-token context window unless you set OLLAMA_NUM_CTX.
// Our truncation uses this to cut notes before sending, so Ollama never silently truncates.
const CONTEXT_BY_PROVIDER: Record<string, number> = {
  'ollama': 4096,
  'ollama-remote': 4096,
  'openai': 16384,
  'groq': 16384,
  'custom': 4096,
}

/**
 * Build an LlmClient from the provider settings stored in IndexedDB.
 * Defaults to MockLlmClient when no provider has been configured.
 */
export async function buildClientFromSettings(): Promise<LlmClient> {
  const [provider, baseUrl, model, apiKey] = await Promise.all([
    getSetting('ai.provider', 'mock'),
    getSetting('ai.baseUrl', ''),
    getSetting('ai.model', ''),
    getSetting('ai.key', ''),
  ])

  if (provider === 'mock') return new MockLlmClient()

  return new OpenAiCompatibleClient({
    baseUrl: baseUrl || 'http://localhost:11434/v1',
    model: model || 'qwen2.5:3b',
    apiKey: apiKey || undefined,
    maxContextTokens: CONTEXT_BY_PROVIDER[provider] ?? 4096,
    // LLM inference is slow on CPU. 7B models can take 3+ min for a full quiz.
    timeoutMs: 240_000,
  })
}

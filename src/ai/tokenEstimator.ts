import type { LlmCapabilities } from './provider'
import type { Section } from '@/features/agent/generateFile'

// ~4 chars/token is accurate for English prose; slightly conservative for code-heavy content
const CHARS_PER_TOKEN = 4

// Budget for system prompt text, user-prompt wrapper, and JSON response scaffolding
const PROMPT_OVERHEAD_TOKENS = 300

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN)
}

export function estimateSectionsTokens(sections: Section[]): number {
  return sections.reduce((sum, s) => sum + estimateTokens(s.text), 0)
}

/**
 * Returns true when all sections fit inside the model's usable context budget.
 * reserveForOutput should match the maxOutputTokens you intend to pass to generateJson.
 */
export function fitsInContext(
  sections: Section[],
  capabilities: LlmCapabilities,
  reserveForOutput: number,
): boolean {
  const available = capabilities.maxContextTokens - reserveForOutput - PROMPT_OVERHEAD_TOKENS
  if (available <= 0) return false
  return estimateSectionsTokens(sections) <= available
}

/**
 * Truncate each section proportionally so the total fits inside the context budget.
 * Returns the original array unchanged if everything already fits.
 */
export function truncateSectionsToFit(
  sections: Section[],
  capabilities: LlmCapabilities,
  reserveForOutput: number,
): Section[] {
  if (fitsInContext(sections, capabilities, reserveForOutput)) return sections

  const available = capabilities.maxContextTokens - reserveForOutput - PROMPT_OVERHEAD_TOKENS
  if (available <= 0) return []

  const availableChars = available * CHARS_PER_TOKEN
  const totalChars = sections.reduce((sum, s) => sum + s.text.length, 0)
  if (totalChars === 0) return sections

  const ratio = availableChars / totalChars
  return sections.map((s) => {
    const maxChars = Math.floor(s.text.length * ratio)
    if (s.text.length <= maxChars) return s
    return { ...s, text: s.text.slice(0, maxChars) + '\n[…truncated to fit context window]' }
  })
}

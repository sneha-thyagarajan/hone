import { describe, expect, it } from 'vitest'
import { estimateTokens, estimateSectionsTokens, fitsInContext, truncateSectionsToFit } from '../tokenEstimator'
import type { Section } from '@/features/agent/generateFile'
import type { LlmCapabilities } from '../provider'

const caps: LlmCapabilities = { maxContextTokens: 8192, structuredOutput: false }

function makeSection(text: string, fileId = 1): Section {
  return { fileId, fileName: 'test.md', text }
}

describe('estimateTokens', () => {
  it('returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0)
  })

  it('rounds up partial tokens', () => {
    // 5 chars → ceil(5/4) = 2
    expect(estimateTokens('Hello')).toBe(2)
  })

  it('handles exactly divisible length', () => {
    // 8 chars → 2 tokens
    expect(estimateTokens('12345678')).toBe(2)
  })

  it('scales linearly', () => {
    const short = estimateTokens('a'.repeat(400))   // 100 tokens
    const long  = estimateTokens('a'.repeat(4000))  // 1000 tokens
    expect(long).toBe(short * 10)
  })
})

describe('estimateSectionsTokens', () => {
  it('returns 0 for an empty array', () => {
    expect(estimateSectionsTokens([])).toBe(0)
  })

  it('sums tokens across sections', () => {
    const sections = [
      makeSection('a'.repeat(400)),  // 100 tokens
      makeSection('b'.repeat(800)),  // 200 tokens
    ]
    expect(estimateSectionsTokens(sections)).toBe(300)
  })
})

describe('fitsInContext', () => {
  it('returns true when sections comfortably fit', () => {
    // 100 tokens of content, 8192 - 1000 (output) - 300 (overhead) = 6892 available
    const sections = [makeSection('a'.repeat(400))]
    expect(fitsInContext(sections, caps, 1000)).toBe(true)
  })

  it('returns false when sections exceed the available budget', () => {
    // ~7000 tokens of content > 6892 available
    const sections = [makeSection('a'.repeat(28_000))]
    expect(fitsInContext(sections, caps, 1000)).toBe(false)
  })

  it('returns false when reserveForOutput alone exceeds context', () => {
    expect(fitsInContext([], caps, 9000)).toBe(false)
  })

  it('returns true for empty sections', () => {
    expect(fitsInContext([], caps, 500)).toBe(true)
  })

  it('uses the capabilities.maxContextTokens correctly', () => {
    const smallCaps: LlmCapabilities = { maxContextTokens: 512, structuredOutput: false }
    // 100 tokens + 300 overhead + 200 output = 600 > 512 → false
    const sections = [makeSection('a'.repeat(400))]
    expect(fitsInContext(sections, smallCaps, 200)).toBe(false)
    // but with a bigger model it fits
    expect(fitsInContext(sections, caps, 200)).toBe(true)
  })
})

describe('truncateSectionsToFit', () => {
  it('returns sections unchanged when they already fit', () => {
    const sections = [makeSection('a'.repeat(400))] // 100 tokens
    const result = truncateSectionsToFit(sections, caps, 1000)
    expect(result).toBe(sections) // same reference
  })

  it('truncates sections proportionally when they are too large', () => {
    // 8192 - 1000 - 300 = 6892 available → 27568 chars max
    // give it 40000 chars → must truncate
    const sections = [makeSection('a'.repeat(40_000))]
    const result = truncateSectionsToFit(sections, caps, 1000)
    expect(result[0].text.length).toBeLessThan(40_000)
    expect(result[0].text).toContain('truncated')
  })

  it('returns [] when reserveForOutput exceeds the full context', () => {
    const sections = [makeSection('a'.repeat(100))]
    const result = truncateSectionsToFit(sections, caps, 9000)
    expect(result).toEqual([])
  })

  it('preserves non-text fields on truncated sections', () => {
    const sections = [
      { fileId: 42, fileName: 'test.pdf', page: 7, text: 'a'.repeat(40_000) },
    ]
    const result = truncateSectionsToFit(sections, caps, 1000)
    expect(result[0].fileId).toBe(42)
    expect(result[0].page).toBe(7)
  })

  it('handles empty sections array', () => {
    expect(truncateSectionsToFit([], caps, 1000)).toEqual([])
  })
})

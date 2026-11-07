import { describe, expect, it } from 'vitest'
import { buildPrompt } from '../prompts'
import type { Section } from '../generateFile'

const sections: Section[] = [
  { fileId: 1, fileName: 'Trees.md', text: '# Binary Trees\n\nA tree with at most two children per node.' },
  { fileId: 2, fileName: 'Heaps.pdf', page: 3, text: 'Min-heap: parent ≤ children.' },
]

describe('buildPrompt', () => {
  it('includes section content in the user prompt', () => {
    const { user } = buildPrompt('quiz', sections, { count: 5 })
    expect(user).toContain('Binary Trees')
    expect(user).toContain('Min-heap')
  })

  it('includes file names in the user prompt', () => {
    const { user } = buildPrompt('quiz', sections, {})
    expect(user).toContain('Trees.md')
    expect(user).toContain('Heaps.pdf (p. 3)')
  })

  it('reflects count in the quiz user prompt', () => {
    const { user } = buildPrompt('quiz', sections, { count: 15, difficulty: 'hard' })
    expect(user).toContain('15')
    expect(user).toContain('hard')
  })

  it('reflects count and focus in the flashcards user prompt', () => {
    const { user } = buildPrompt('flashcards', sections, { count: 25, focus: 'concepts' })
    expect(user).toContain('25')
    expect(user).toContain('concepts')
  })

  it('quiz schema is described in the system prompt', () => {
    const { system } = buildPrompt('quiz', sections, {})
    expect(system).toContain('answerIndex')
    expect(system).toContain('explanation')
  })

  it('flashcards schema is described in the system prompt', () => {
    const { system } = buildPrompt('flashcards', sections, {})
    expect(system).toContain('"front"')
    expect(system).toContain('"back"')
  })

  it('notes and cheatsheet schema uses content envelope', () => {
    const notes = buildPrompt('ai_notes', sections, {})
    const cs    = buildPrompt('cheatsheet', sections, {})
    expect(notes.system).toContain('"content"')
    expect(cs.system).toContain('"content"')
  })

  it('maxOutputTokens scales with quiz count', () => {
    const few  = buildPrompt('quiz', sections, { count: 5 })
    const many = buildPrompt('quiz', sections, { count: 20 })
    expect(many.maxOutputTokens).toBeGreaterThan(few.maxOutputTokens)
  })

  it('handles empty sections gracefully', () => {
    const { user } = buildPrompt('quiz', [], { count: 5 })
    expect(typeof user).toBe('string')
  })
})

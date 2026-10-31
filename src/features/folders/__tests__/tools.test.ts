import { describe, expect, it } from 'vitest'
import { getAllowedTools } from '../tools'

describe('getAllowedTools', () => {
  it('theory: notes + uploads + AI files, no code practice', () => {
    const t = getAllowedTools('theory')
    expect(t.canNote).toBe(true)
    expect(t.notesTab).toBe(true)
    expect(t.canUpload).toBe(true)
    expect(t.canCode).toBe(false)
    expect(t.practiceTab).toBe(false)
    expect(t.aiOutputs).toEqual(['notes', 'flashcards', 'quiz', 'mock', 'plan'])
  })

  it('coding: uploads + code practice + AI (incl. code), NO standalone notes', () => {
    const t = getAllowedTools('coding')
    expect(t.canUpload).toBe(true)
    expect(t.canNote).toBe(false)
    expect(t.notesTab).toBe(false)
    expect(t.canCode).toBe(true)
    expect(t.practiceTab).toBe(true)
    expect(t.aiOutputs).toContain('code')
  })

  it('mixed: everything', () => {
    const t = getAllowedTools('mixed')
    expect(t.canUpload).toBe(true)
    expect(t.canNote).toBe(true)
    expect(t.notesTab).toBe(true)
    expect(t.canCode).toBe(true)
    expect(t.practiceTab).toBe(true)
    expect(t.aiOutputs).toEqual(['notes', 'flashcards', 'quiz', 'mock', 'plan', 'code'])
  })

  it('uploads are available for every kind', () => {
    for (const kind of ['theory', 'coding', 'mixed'] as const) {
      expect(getAllowedTools(kind).canUpload).toBe(true)
    }
  })
})

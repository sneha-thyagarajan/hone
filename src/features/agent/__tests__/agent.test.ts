import { describe, expect, it } from 'vitest'
import { defaultOptions, OPTION_FIELDS, TYPE_META, AI_TYPES } from '../types'
import {
  defaultFileName,
  estimatePages,
  hasGeneratableSources,
  selectableSources,
} from '../sources'
import { FILE_TYPE_META } from '@/features/files/fileMeta'
import type { HoneFile } from '@/db/types'

const file = (over: Partial<HoneFile>): HoneFile => ({
  id: Math.floor(Math.random() * 1e6),
  folderId: 1,
  type: 'note',
  name: 'f',
  createdAt: 0,
  updatedAt: 0,
  ...over,
})

describe('options per type', () => {
  it('has defaults for every type', () => {
    expect(defaultOptions('quiz')).toEqual({ count: 10, difficulty: 'medium' })
    expect(defaultOptions('flashcards')).toEqual({ count: 20, focus: 'terms' })
    expect(defaultOptions('ai_notes')).toEqual({ length: 'standard' })
    expect(defaultOptions('cheatsheet')).toEqual({ density: 'compact' })
  })

  it('every default matches an available choice', () => {
    for (const type of AI_TYPES) {
      const opts = defaultOptions(type)
      for (const field of OPTION_FIELDS[type]) {
        const values = field.choices.map((c) => c.value)
        expect(values).toContain(opts[field.key])
      }
    }
  })

  it('quiz offers 5/10/20 and easy/medium/hard', () => {
    const [count, difficulty] = OPTION_FIELDS.quiz
    expect(count.choices.map((c) => c.value)).toEqual([5, 10, 20])
    expect(difficulty.choices.map((c) => c.value)).toEqual(['easy', 'medium', 'hard'])
  })
})

describe('source selection', () => {
  const files = [
    file({ id: 1, type: 'note' }),
    file({ id: 2, type: 'upload' }),
    file({ id: 3, type: 'quiz' }), // AI-made, excluded
    file({ id: 4, type: 'code' }), // excluded
    file({ id: 5, type: 'flashcards' }), // AI-made, excluded
  ]

  it('offers only notes and uploads', () => {
    expect(selectableSources(files).map((f) => f.id)).toEqual([1, 2])
  })

  it('estimates pages from uploads (pageCount) and notes (length)', () => {
    const picked = [
      file({ type: 'upload', meta: { pageCount: 8 } }),
      file({ type: 'note', content: 'x'.repeat(1800) }), // ~1 page
    ]
    expect(estimatePages(picked)).toBe(9)
  })

  it('knows when a folder has no usable sources', () => {
    expect(hasGeneratableSources([file({ type: 'quiz' }), file({ type: 'code' })])).toBe(false)
    expect(hasGeneratableSources([file({ type: 'note' })])).toBe(true)
  })
})

describe('defaultFileName', () => {
  it('uses "<Label> · <folder>"', () => {
    expect(defaultFileName('quiz', 'Data Structures', [])).toBe('Quiz · Data Structures')
    expect(defaultFileName('cheatsheet', 'DS', [])).toBe('Cheat sheet · DS')
  })
  it('numbers when the name is taken', () => {
    const existing = ['Quiz · DS', 'Quiz · DS (2)']
    expect(defaultFileName('quiz', 'DS', existing)).toBe('Quiz · DS (3)')
  })
})

describe('AI-made tab', () => {
  it('maps all AI types to the AI-made filter', () => {
    for (const type of AI_TYPES) {
      expect(FILE_TYPE_META[TYPE_META[type].fileType].filter).toBe('ai')
    }
  })
})

import { describe, expect, it } from 'vitest'
import {
  countWords,
  toggleHeading,
  toggleList,
  toggleWrap,
  type EditState,
} from '../markdownCommands'

const sel = (text: string, from: number, to = from): EditState => ({ text, from, to })

describe('toggleWrap', () => {
  it('wraps a selection with the marker', () => {
    const r = toggleWrap(sel('hello world', 0, 5), '**')
    expect(r.text).toBe('**hello** world')
    expect([r.from, r.to]).toEqual([2, 7])
  })

  it('unwraps when markers surround the selection', () => {
    const r = toggleWrap(sel('**hello** world', 2, 7), '**')
    expect(r.text).toBe('hello world')
    expect([r.from, r.to]).toEqual([0, 5])
  })

  it('unwraps when the selection includes the markers', () => {
    const r = toggleWrap(sel('**hello** world', 0, 9), '**')
    expect(r.text).toBe('hello world')
  })

  it('inserts an empty marker pair at the cursor', () => {
    const r = toggleWrap(sel('ab', 1), '*')
    expect(r.text).toBe('a**b')
    expect([r.from, r.to]).toEqual([2, 2])
  })
})

describe('toggleHeading', () => {
  it('adds a heading prefix', () => {
    const r = toggleHeading(sel('Title', 0), 2)
    expect(r.text).toBe('## Title')
  })

  it('removes the prefix when the level matches', () => {
    const r = toggleHeading(sel('## Title', 3), 2)
    expect(r.text).toBe('Title')
  })

  it('changes the level when different', () => {
    const r = toggleHeading(sel('## Title', 3), 1)
    expect(r.text).toBe('# Title')
  })

  it('only affects the line containing the cursor', () => {
    const r = toggleHeading(sel('a\nb\nc', 2), 2)
    expect(r.text).toBe('a\n## b\nc')
  })
})

describe('toggleList', () => {
  it('bullets a single line', () => {
    const r = toggleList(sel('item', 0))
    expect(r.text).toBe('- item')
  })

  it('removes bullets when all lines are bulleted', () => {
    const r = toggleList(sel('- a\n- b', 0, 7))
    expect(r.text).toBe('a\nb')
  })

  it('bullets every line spanned by the selection', () => {
    const r = toggleList(sel('a\nb', 0, 3))
    expect(r.text).toBe('- a\n- b')
  })
})

describe('countWords', () => {
  it('counts words separated by whitespace', () => {
    expect(countWords('one two three')).toBe(3)
  })

  it('returns 0 for empty or whitespace', () => {
    expect(countWords('')).toBe(0)
    expect(countWords('   \n\t ')).toBe(0)
  })

  it('collapses multiple spaces and newlines', () => {
    expect(countWords('a\n\nb   c')).toBe(3)
  })
})

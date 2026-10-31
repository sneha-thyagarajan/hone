import { describe, expect, it } from 'vitest'
import { activeOutlineIndex, extractOutline, proportionalScrollTop } from '../outline'

describe('extractOutline', () => {
  it('extracts headings with level, text and line', () => {
    const md = '# Title\n\nintro\n\n## Section A\ntext\n### Sub\n'
    expect(extractOutline(md)).toEqual([
      { level: 1, text: 'Title', line: 0 },
      { level: 2, text: 'Section A', line: 4 },
      { level: 3, text: 'Sub', line: 6 },
    ])
  })

  it('ignores headings inside fenced code blocks', () => {
    const md = '# Real\n\n```\n# not a heading\n```\n\n## Also real'
    expect(extractOutline(md).map((h) => h.text)).toEqual(['Real', 'Also real'])
  })

  it('handles ~~~ fences and trailing hashes', () => {
    const md = '## Heading ##\n~~~\n### nope\n~~~\n# End'
    expect(extractOutline(md).map((h) => h.text)).toEqual(['Heading', 'End'])
  })

  it('returns empty for no headings', () => {
    expect(extractOutline('just text\nmore text')).toEqual([])
  })
})

describe('proportionalScrollTop', () => {
  it('maps the midpoint proportionally', () => {
    expect(
      proportionalScrollTop({
        sourceScrollTop: 500,
        sourceScrollHeight: 2000,
        sourceClientHeight: 1000, // sourceMax 1000, ratio 0.5
        targetScrollHeight: 5000,
        targetClientHeight: 1000, // targetMax 4000
      }),
    ).toBe(2000)
  })

  it('returns 0 when the source cannot scroll', () => {
    expect(
      proportionalScrollTop({
        sourceScrollTop: 0,
        sourceScrollHeight: 800,
        sourceClientHeight: 1000,
        targetScrollHeight: 5000,
        targetClientHeight: 1000,
      }),
    ).toBe(0)
  })

  it('clamps at the bottom', () => {
    expect(
      proportionalScrollTop({
        sourceScrollTop: 9999,
        sourceScrollHeight: 2000,
        sourceClientHeight: 1000,
        targetScrollHeight: 3000,
        targetClientHeight: 1000,
      }),
    ).toBe(2000)
  })
})

describe('activeOutlineIndex', () => {
  const outline = [
    { level: 1, text: 'A', line: 0 },
    { level: 2, text: 'B', line: 10 },
    { level: 2, text: 'C', line: 20 },
  ]
  it('picks the last heading at or above the top line', () => {
    expect(activeOutlineIndex(outline, 0)).toBe(0)
    expect(activeOutlineIndex(outline, 9)).toBe(0)
    expect(activeOutlineIndex(outline, 10)).toBe(1)
    expect(activeOutlineIndex(outline, 25)).toBe(2)
  })
  it('returns -1 before the first heading', () => {
    expect(activeOutlineIndex([{ level: 1, text: 'A', line: 5 }], 2)).toBe(-1)
  })
})

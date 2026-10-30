import { describe, expect, it } from 'vitest'
import { chunkPages } from '../chunker'
import type { ParsedPage } from '../types'

describe('chunkPages', () => {
  it('returns no chunks for empty input', () => {
    expect(chunkPages([], 'f.pdf')).toEqual([])
  })

  it('skips blank pages', () => {
    const pages: ParsedPage[] = [
      { page: 1, text: '   \n\n  ' },
      { page: 2, text: 'Real content' },
    ]
    const chunks = chunkPages(pages, 'f.pdf')
    expect(chunks).toHaveLength(1)
    expect(chunks[0].page).toBe(2)
  })

  it('keeps source and page on every chunk', () => {
    const chunks = chunkPages([{ page: 7, text: 'Heaps are complete binary trees.' }], 'ds.pdf')
    expect(chunks).toEqual([{ source: 'ds.pdf', page: 7, text: 'Heaps are complete binary trees.' }])
  })

  it('normalizes CRLF and collapses blank lines', () => {
    const chunks = chunkPages([{ page: 1, text: 'a\r\n\r\n\r\n\r\nb' }], 'f.txt')
    // a and b are separate paragraphs; they fit in one chunk joined by one blank line
    expect(chunks).toHaveLength(1)
    expect(chunks[0].text).toBe('a\n\nb')
  })

  it('splits long text into multiple chunks under the limit', () => {
    const para = Array.from({ length: 20 }, (_, i) => `Sentence number ${i} here.`).join(' ')
    const chunks = chunkPages([{ page: 1, text: para }], 'f.pdf', { maxChars: 80 })
    expect(chunks.length).toBeGreaterThan(1)
    for (const c of chunks) {
      expect(c.text.length).toBeLessThanOrEqual(80)
      expect(c.page).toBe(1)
    }
  })

  it('preserves page numbers across multiple pages', () => {
    const chunks = chunkPages(
      [
        { page: 1, text: 'one' },
        { page: 2, text: 'two' },
        { page: 3, text: 'three' },
      ],
      'f.pdf',
    )
    expect(chunks.map((c) => c.page)).toEqual([1, 2, 3])
    expect(chunks.map((c) => c.text)).toEqual(['one', 'two', 'three'])
  })

  it('hard-slices a single oversized word', () => {
    const chunks = chunkPages([{ page: 1, text: 'x'.repeat(250) }], 'f.pdf', { maxChars: 100 })
    expect(chunks).toHaveLength(3)
    expect(chunks.every((c) => c.text.length <= 100)).toBe(true)
  })

  it('packs multiple short paragraphs into one chunk', () => {
    const chunks = chunkPages([{ page: 1, text: 'a\n\nb\n\nc' }], 'f.md', { maxChars: 1000 })
    expect(chunks).toHaveLength(1)
    expect(chunks[0].text).toBe('a\n\nb\n\nc')
  })
})

import { describe, expect, it } from 'vitest'
import { parseDocx } from '../docx'
import { parsePptx } from '../pptx'
import { parsePdf } from '../pdf'
import { parseText } from '../text'
import { parseDocument, detectType } from '../index'
import { makeDocx, makePptx, makePdf, makeText } from './fixtures'

describe('detectType', () => {
  it('maps known extensions', () => {
    expect(detectType('a.pdf')).toBe('pdf')
    expect(detectType('b.PPTX')).toBe('pptx')
    expect(detectType('c.docx')).toBe('docx')
    expect(detectType('d.md')).toBe('md')
    expect(detectType('e.markdown')).toBe('md')
    expect(detectType('f.txt')).toBe('txt')
  })

  it('returns null for unsupported types', () => {
    expect(detectType('image.png')).toBeNull()
    expect(detectType('noext')).toBeNull()
  })
})

describe('parseText', () => {
  it('decodes plain text into a single page', () => {
    const pages = parseText(makeText('Hello\nworld'))
    expect(pages).toEqual([{ page: 1, text: 'Hello\nworld' }])
  })

  it('decodes markdown as raw text', () => {
    const pages = parseText(makeText('# Heading\n\n- bullet'))
    expect(pages[0].text).toContain('# Heading')
  })
})

describe('parseDocx', () => {
  it('extracts paragraph text as a single page', async () => {
    const docx = await makeDocx(['Hello world', 'Second paragraph'])
    const pages = await parseDocx(docx)
    expect(pages).toHaveLength(1)
    expect(pages[0].page).toBe(1)
    expect(pages[0].text).toContain('Hello world')
    expect(pages[0].text).toContain('Second paragraph')
  })
})

describe('parsePptx', () => {
  it('extracts one page per slide, in order, with slide numbers', async () => {
    const pptx = await makePptx([
      ['Slide one title', 'first bullet'],
      ['Slide two title'],
    ])
    const pages = await parsePptx(pptx)
    expect(pages).toHaveLength(2)
    expect(pages[0]).toEqual({ page: 1, text: 'Slide one title first bullet' })
    expect(pages[1]).toEqual({ page: 2, text: 'Slide two title' })
  })

  it('decodes XML entities in slide text', async () => {
    const pptx = await makePptx([['Tom & Jerry <3']])
    const pages = await parsePptx(pptx)
    expect(pages[0].text).toBe('Tom & Jerry <3')
  })
})

describe('parsePdf', () => {
  it('extracts text per page', async () => {
    const pdf = makePdf(['Hello PDF', 'Line two'])
    const pages = await parsePdf(pdf)
    expect(pages).toHaveLength(1)
    expect(pages[0].page).toBe(1)
    expect(pages[0].text.replace(/\s+/g, ' ')).toContain('Hello PDF')
  })

  it('reports progress', async () => {
    const pdf = makePdf(['x'])
    const calls: Array<[number, number]> = []
    await parsePdf(pdf, (page, total) => calls.push([page, total]))
    expect(calls).toEqual([[1, 1]])
  })
})

describe('parseDocument dispatch', () => {
  it('routes by type', async () => {
    const pages = await parseDocument('txt', makeText('hi'))
    expect(pages[0].text).toBe('hi')
  })

  it('throws on unsupported type', async () => {
    // @ts-expect-error testing the runtime guard
    await expect(parseDocument('xls', makeText('x'))).rejects.toThrow('Unsupported file type')
  })
})

import { describe, expect, it } from 'vitest'
import {
  PROBLEM_TAB_ID,
  addTab,
  deleteTab,
  makeProblemTab,
  renameTab,
  reorderTab,
  tabImageIds,
  type NoteTab,
} from '../noteTabs'

const base = (): NoteTab[] => [makeProblemTab('solve it'), { id: 'a', title: 'A', kind: 'text', text: '' }]

describe('addTab', () => {
  it('appends a text tab with an id', () => {
    const { tabs, id } = addTab(base(), 'text')
    expect(tabs).toHaveLength(3)
    expect(tabs[2]).toMatchObject({ id, kind: 'text', text: '' })
  })

  it('appends an image tab with an empty image list', () => {
    const { tabs } = addTab(base(), 'image')
    expect(tabs[2]).toMatchObject({ kind: 'image', images: [] })
  })
})

describe('renameTab', () => {
  it('renames a tab', () => {
    expect(renameTab(base(), 'a', 'Edge cases')[1].title).toBe('Edge cases')
  })
  it('ignores a blank title', () => {
    expect(renameTab(base(), 'a', '   ')[1].title).toBe('A')
  })
  it('can rename the Problem tab', () => {
    expect(renameTab(base(), PROBLEM_TAB_ID, 'Prompt')[0].title).toBe('Prompt')
  })
})

describe('deleteTab', () => {
  it('removes a normal tab', () => {
    expect(deleteTab(base(), 'a')).toHaveLength(1)
  })
  it('refuses to delete the Problem tab', () => {
    expect(deleteTab(base(), PROBLEM_TAB_ID)).toHaveLength(2)
  })
})

describe('reorderTab', () => {
  it('keeps the Problem tab first', () => {
    const tabs: NoteTab[] = [makeProblemTab(), { id: 'a', title: 'A', kind: 'text' }, { id: 'b', title: 'B', kind: 'text' }]
    // try to move A before Problem (index 0) → clamped to index 1
    const r = reorderTab(tabs, 'a', 0)
    expect(r[0].id).toBe(PROBLEM_TAB_ID)
  })

  it('moves a tab to a later index', () => {
    const tabs: NoteTab[] = [makeProblemTab(), { id: 'a', title: 'A', kind: 'text' }, { id: 'b', title: 'B', kind: 'text' }]
    expect(reorderTab(tabs, 'a', 2).map((t) => t.id)).toEqual([PROBLEM_TAB_ID, 'b', 'a'])
  })

  it('refuses to move the Problem tab', () => {
    const tabs: NoteTab[] = [makeProblemTab(), { id: 'a', title: 'A', kind: 'text' }]
    expect(reorderTab(tabs, PROBLEM_TAB_ID, 1).map((t) => t.id)).toEqual([PROBLEM_TAB_ID, 'a'])
  })
})

describe('tabImageIds', () => {
  it('collects image blob ids', () => {
    expect(tabImageIds({ id: 'i', title: 'Img', kind: 'image', images: ['x', 'y'] })).toEqual(['x', 'y'])
  })
  it('returns none for text tabs', () => {
    expect(tabImageIds({ id: 't', title: 'T', kind: 'text', text: 'hi' })).toEqual([])
  })
})

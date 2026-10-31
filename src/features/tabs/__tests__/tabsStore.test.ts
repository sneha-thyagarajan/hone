import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import {
  closeTab,
  loadTabs,
  moveTab,
  openTab,
  pruneTabs,
  saveTabs,
  type TabsSnapshot,
} from '../tabsStore'

const empty: TabsSnapshot = { openIds: [], activeId: null }

describe('openTab', () => {
  it('opens a new file and makes it active', () => {
    expect(openTab(empty, 1)).toEqual({ openIds: [1], activeId: 1 })
  })

  it('focuses an existing tab without duplicating it', () => {
    const s = { openIds: [1, 2, 3], activeId: 3 }
    expect(openTab(s, 2)).toEqual({ openIds: [1, 2, 3], activeId: 2 })
  })
})

describe('closeTab', () => {
  it('removes a tab and activates the neighbour when closing the active one', () => {
    expect(closeTab({ openIds: [1, 2, 3], activeId: 2 }, 2)).toEqual({
      openIds: [1, 3],
      activeId: 3, // the tab that shifted into the old index
    })
  })

  it('falls back to the previous tab when closing the last, active tab', () => {
    expect(closeTab({ openIds: [1, 2], activeId: 2 }, 2)).toEqual({ openIds: [1], activeId: 1 })
  })

  it('keeps the active tab when closing a different one', () => {
    expect(closeTab({ openIds: [1, 2, 3], activeId: 1 }, 3)).toEqual({
      openIds: [1, 2],
      activeId: 1,
    })
  })

  it('goes to null when closing the only tab', () => {
    expect(closeTab({ openIds: [1], activeId: 1 }, 1)).toEqual({ openIds: [], activeId: null })
  })
})

describe('moveTab', () => {
  it('reorders tabs', () => {
    expect(moveTab({ openIds: [1, 2, 3], activeId: 1 }, 0, 2).openIds).toEqual([2, 3, 1])
  })
})

describe('pruneTabs', () => {
  it('drops tabs whose file no longer exists', () => {
    const s = { openIds: [1, 2, 3], activeId: 2 }
    expect(pruneTabs(s, [1, 3])).toEqual({ openIds: [1, 3], activeId: 3 })
  })
  it('keeps the active tab if it still exists', () => {
    expect(pruneTabs({ openIds: [1, 2, 3], activeId: 1 }, [1, 2])).toEqual({
      openIds: [1, 2],
      activeId: 1,
    })
  })
})

describe('persistence (restore across reload)', () => {
  beforeEach(async () => {
    await db.settings.clear()
  })

  it('saves and reloads the open tabs and active tab', async () => {
    await saveTabs({ openIds: [4, 7, 9], activeId: 7 })
    expect(await loadTabs()).toEqual({ openIds: [4, 7, 9], activeId: 7 })
  })

  it('defaults to empty when nothing was saved', async () => {
    expect(await loadTabs()).toEqual({ openIds: [], activeId: null })
  })
})

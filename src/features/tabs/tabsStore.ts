import { create } from 'zustand'
import { db } from '@/db'

const KEY = 'openTabs'

export interface TabsSnapshot {
  openIds: number[]
  activeId: number | null
}

/** Open a file in a tab, or focus it if already open. */
export function openTab(s: TabsSnapshot, id: number): TabsSnapshot {
  return s.openIds.includes(id)
    ? { openIds: s.openIds, activeId: id }
    : { openIds: [...s.openIds, id], activeId: id }
}

/** Close a tab; if it was active, activate its neighbour. */
export function closeTab(s: TabsSnapshot, id: number): TabsSnapshot {
  const idx = s.openIds.indexOf(id)
  const openIds = s.openIds.filter((x) => x !== id)
  let activeId = s.activeId
  if (s.activeId === id) activeId = openIds[idx] ?? openIds[idx - 1] ?? null
  return { openIds, activeId }
}

export function moveTab(s: TabsSnapshot, from: number, to: number): TabsSnapshot {
  if (from === to || from < 0 || from >= s.openIds.length) return s
  const openIds = [...s.openIds]
  const [moved] = openIds.splice(from, 1)
  openIds.splice(Math.max(0, Math.min(to, openIds.length)), 0, moved)
  return { openIds, activeId: s.activeId }
}

/** Drop tabs whose file no longer exists (e.g. it was deleted). */
export function pruneTabs(s: TabsSnapshot, existingIds: number[]): TabsSnapshot {
  const set = new Set(existingIds)
  const openIds = s.openIds.filter((id) => set.has(id))
  if (openIds.length === s.openIds.length) return s
  const activeId = s.activeId && openIds.includes(s.activeId) ? s.activeId : (openIds.at(-1) ?? null)
  return { openIds, activeId }
}

export async function saveTabs(snap: TabsSnapshot): Promise<void> {
  await db.settings.put({ key: KEY, value: snap })
}

export async function loadTabs(): Promise<TabsSnapshot> {
  const row = await db.settings.get(KEY)
  const value = row?.value as TabsSnapshot | undefined
  return { openIds: value?.openIds ?? [], activeId: value?.activeId ?? null }
}

interface TabsState extends TabsSnapshot {
  hydrated: boolean
  hydrate: () => Promise<void>
  open: (id: number) => void
  setActive: (id: number | null) => void
  close: (id: number) => number | null
  move: (from: number, to: number) => void
  prune: (existingIds: number[]) => void
}

export const useTabsStore = create<TabsState>((set, get) => ({
  openIds: [],
  activeId: null,
  hydrated: false,
  hydrate: async () => {
    const snap = await loadTabs()
    set({ ...snap, hydrated: true })
  },
  open: (id) => {
    const snap = openTab(get(), id)
    set(snap)
    void saveTabs(snap)
  },
  setActive: (id) => {
    set({ activeId: id })
    void saveTabs({ openIds: get().openIds, activeId: id })
  },
  close: (id) => {
    const snap = closeTab(get(), id)
    set(snap)
    void saveTabs(snap)
    return snap.activeId
  },
  move: (from, to) => {
    const snap = moveTab(get(), from, to)
    set(snap)
    void saveTabs(snap)
  },
  prune: (existingIds) => {
    const snap = pruneTabs(get(), existingIds)
    if (snap !== get()) {
      set(snap)
      void saveTabs(snap)
    }
  },
}))

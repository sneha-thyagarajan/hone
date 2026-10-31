export type NoteTabKind = 'text' | 'image'

export interface NoteTab {
  id: string
  title: string
  kind: NoteTabKind
  /** Markdown, for text tabs. */
  text?: string
  /** Blob ids (stored in the `blobs` table), for image tabs. */
  images?: string[]
}

export const PROBLEM_TAB_ID = 'problem'

export function makeProblemTab(text = ''): NoteTab {
  return { id: PROBLEM_TAB_ID, title: 'Problem', kind: 'text', text }
}

export function addTab(tabs: NoteTab[], kind: NoteTabKind): { tabs: NoteTab[]; id: string } {
  const id = crypto.randomUUID()
  const tab: NoteTab =
    kind === 'image'
      ? { id, title: 'Images', kind, images: [] }
      : { id, title: 'Notes', kind, text: '' }
  return { tabs: [...tabs, tab], id }
}

export function renameTab(tabs: NoteTab[], id: string, title: string): NoteTab[] {
  const trimmed = title.trim()
  return tabs.map((t) => (t.id === id ? { ...t, title: trimmed || t.title } : t))
}

/** Deletes a tab. The Problem tab can't be deleted. */
export function deleteTab(tabs: NoteTab[], id: string): NoteTab[] {
  if (id === PROBLEM_TAB_ID) return tabs
  return tabs.filter((t) => t.id !== id)
}

/** Move a tab to a new index. The Problem tab stays pinned at index 0. */
export function reorderTab(tabs: NoteTab[], fromId: string, toIndex: number): NoteTab[] {
  if (fromId === PROBLEM_TAB_ID) return tabs
  const moving = tabs.find((t) => t.id === fromId)
  if (!moving) return tabs
  const without = tabs.filter((t) => t.id !== fromId)
  const clamped = Math.max(1, Math.min(toIndex, without.length))
  without.splice(clamped, 0, moving)
  return without
}

/** All image blob ids referenced by a tab (for cleanup on delete). */
export function tabImageIds(tab: NoteTab): string[] {
  return tab.kind === 'image' ? (tab.images ?? []) : []
}

export function setTabText(tabs: NoteTab[], id: string, text: string): NoteTab[] {
  return tabs.map((t) => (t.id === id ? { ...t, text } : t))
}

export function setTabImages(tabs: NoteTab[], id: string, images: string[]): NoteTab[] {
  return tabs.map((t) => (t.id === id ? { ...t, images } : t))
}

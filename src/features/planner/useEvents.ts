import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import type { CalEvent, CalEventKind, Folder } from '@/db/types'
import { useFolders } from '@/features/folders/useFolders'

/** A calendar entry — either a user event or a folder's exam date. */
export interface CalendarItem {
  key: string
  title: string
  date: string
  kind: CalEventKind
  folderId?: number
  /** Folder-exam items are edited via the folder, not deleted from the calendar. */
  eventId?: number
}

export function useEvents(): CalEvent[] {
  return useLiveQuery(() => db.events.toArray(), [], [])
}

/** Merge user events and folder exam dates into one list of calendar items. */
export function useCalendarItems(): CalendarItem[] {
  const events = useEvents()
  const folders = useFolders()

  const fromEvents: CalendarItem[] = events.map((e) => ({
    key: `event-${e.id}`,
    title: e.title,
    date: e.date,
    kind: e.kind,
    folderId: e.folderId,
    eventId: e.id,
  }))

  const fromFolders: CalendarItem[] = folders
    .filter((f: Folder) => f.examDate)
    .map((f) => ({
      key: `folder-${f.id}`,
      title: `${f.name} exam`,
      date: f.examDate!,
      kind: 'exam' as const,
      folderId: f.id,
    }))

  return [...fromEvents, ...fromFolders]
}

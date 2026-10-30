import { db } from '@/db'
import type { CalEventKind } from '@/db/types'

export interface CreateEventInput {
  title: string
  date: string
  kind: CalEventKind
  folderId?: number
}

export async function createEvent(input: CreateEventInput): Promise<number> {
  const title = input.title.trim()
  if (!title) throw new Error('Event needs a title')
  if (!input.date) throw new Error('Event needs a date')
  return db.events.add({
    title,
    date: input.date,
    kind: input.kind,
    folderId: input.folderId,
  })
}

export async function deleteEvent(id: number): Promise<void> {
  await db.events.delete(id)
}

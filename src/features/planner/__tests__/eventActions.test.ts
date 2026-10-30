import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { createEvent, deleteEvent } from '../eventActions'

beforeEach(async () => {
  await db.events.clear()
})

describe('createEvent', () => {
  it('persists an event', async () => {
    const id = await createEvent({ title: 'Heaps review', date: '2026-11-10', kind: 'study' })
    const ev = await db.events.get(id)
    expect(ev).toMatchObject({ title: 'Heaps review', date: '2026-11-10', kind: 'study' })
  })

  it('trims the title and keeps the folder link', async () => {
    const id = await createEvent({ title: '  Midterm ', date: '2026-11-13', kind: 'exam', folderId: 5 })
    const ev = await db.events.get(id)
    expect(ev?.title).toBe('Midterm')
    expect(ev?.folderId).toBe(5)
  })

  it('rejects a blank title or missing date', async () => {
    await expect(createEvent({ title: '  ', date: '2026-11-13', kind: 'exam' })).rejects.toThrow(
      'title',
    )
    await expect(createEvent({ title: 'x', date: '', kind: 'exam' })).rejects.toThrow('date')
  })
})

describe('deleteEvent', () => {
  it('removes the event', async () => {
    const id = await createEvent({ title: 'x', date: '2026-11-13', kind: 'exam' })
    await deleteEvent(id)
    expect(await db.events.get(id)).toBeUndefined()
  })
})

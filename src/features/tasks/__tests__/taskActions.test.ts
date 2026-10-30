import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { createTask, deleteTask, toggleTask } from '../taskActions'

beforeEach(async () => {
  await db.tasks.clear()
})

describe('createTask', () => {
  it('creates an undone task with a date', async () => {
    const id = await createTask({ title: 'Finish Trees quiz', date: '2026-10-17' })
    const task = await db.tasks.get(id)
    expect(task).toMatchObject({ title: 'Finish Trees quiz', done: false, date: '2026-10-17' })
  })

  it('rejects a blank title', async () => {
    await expect(createTask({ title: '   ' })).rejects.toThrow('title')
  })
})

describe('toggleTask', () => {
  it('flips the done flag', async () => {
    const id = await createTask({ title: 'x', date: '2026-10-17' })
    await toggleTask(id, true)
    expect((await db.tasks.get(id))?.done).toBe(true)
    await toggleTask(id, false)
    expect((await db.tasks.get(id))?.done).toBe(false)
  })
})

describe('deleteTask', () => {
  it('removes the task', async () => {
    const id = await createTask({ title: 'x', date: '2026-10-17' })
    await deleteTask(id)
    expect(await db.tasks.get(id)).toBeUndefined()
  })
})

describe('tasks by date', () => {
  it('queries tasks for a specific day', async () => {
    await createTask({ title: 'today', date: '2026-10-17' })
    await createTask({ title: 'tomorrow', date: '2026-10-18' })
    const todays = await db.tasks.where('date').equals('2026-10-17').toArray()
    expect(todays.map((t) => t.title)).toEqual(['today'])
  })
})

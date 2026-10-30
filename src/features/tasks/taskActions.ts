import { db } from '@/db'

export interface CreateTaskInput {
  title: string
  date?: string
  folderId?: number
}

export async function createTask(input: CreateTaskInput): Promise<number> {
  const title = input.title.trim()
  if (!title) throw new Error('Task needs a title')
  return db.tasks.add({ title, done: false, date: input.date, folderId: input.folderId })
}

export async function toggleTask(id: number, done: boolean): Promise<void> {
  await db.tasks.update(id, { done })
}

export async function deleteTask(id: number): Promise<void> {
  await db.tasks.delete(id)
}

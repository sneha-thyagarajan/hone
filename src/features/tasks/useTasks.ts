import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import type { Task } from '@/db/types'

/** Tasks due on a given ISO date (e.g. today's plan). */
export function useTasksForDate(iso: string | undefined): Task[] {
  return (
    useLiveQuery(
      () => (iso ? db.tasks.where('date').equals(iso).toArray() : Promise.resolve([] as Task[])),
      [iso],
    ) ?? []
  )
}

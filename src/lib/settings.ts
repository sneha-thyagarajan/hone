import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'

/** A persisted setting backed by the Dexie `settings` table. */
export function useSetting<T>(key: string, fallback: T): [T, (value: T) => void] {
  const value = useLiveQuery(
    async () => {
      const row = await db.settings.get(key)
      return row ? (row.value as T) : fallback
    },
    [key],
    fallback,
  )
  const setValue = (v: T) => {
    db.settings.put({ key, value: v })
  }
  return [value ?? fallback, setValue]
}

import { useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTasksForDate } from './useTasks'
import { createTask, deleteTask, toggleTask } from './taskActions'

interface Props {
  /** ISO date the tasks belong to. */
  date: string
  emptyText?: string
}

export function TodoList({ date, emptyText = 'Nothing planned.' }: Props) {
  const tasks = useTasksForDate(date)
  const [title, setTitle] = useState('')

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    await createTask({ title, date })
    setTitle('')
  }

  return (
    <div className="flex flex-col gap-1">
      {tasks.length === 0 && <p className="px-1 py-2 text-sm text-muted">{emptyText}</p>}

      {tasks.map((t) => (
        <div key={t.id} className="group flex items-center gap-2.5 rounded-md px-1 py-1.5">
          <button
            onClick={() => toggleTask(t.id!, !t.done)}
            className={cn(
              'flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border transition-colors',
              t.done ? 'border-accent bg-accent text-on-accent' : 'border-muted hover:border-accent',
            )}
            aria-label={t.done ? 'Mark not done' : 'Mark done'}
          >
            {t.done && <Check size={12} />}
          </button>
          <span
            className={cn('flex-1 text-sm', t.done ? 'text-muted line-through' : 'text-ink')}
          >
            {t.title}
          </span>
          <button
            onClick={() => deleteTask(t.id!)}
            className="flex-shrink-0 rounded p-0.5 text-muted opacity-0 transition hover:bg-surface-2 hover:text-ink group-hover:opacity-100"
            aria-label="Delete task"
          >
            <X size={13} />
          </button>
        </div>
      ))}

      <form
        onSubmit={add}
        className="mt-1.5 flex items-center gap-2 rounded-btn border border-line bg-surface-2/60 px-3 py-2 transition-colors focus-within:border-accent focus-within:bg-surface focus-within:ring-2 focus-within:ring-accent/20"
      >
        <Plus size={14} className="flex-shrink-0 text-muted" />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task…"
          className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
        />
      </form>
    </div>
  )
}

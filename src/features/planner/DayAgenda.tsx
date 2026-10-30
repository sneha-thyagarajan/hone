import { format } from 'date-fns'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toISODate } from '@/lib/dates'
import { deleteEvent } from './eventActions'
import { TodoList } from '@/features/tasks/TodoList'
import type { CalendarItem } from './useEvents'
import type { CalEventKind } from '@/db/types'

const KIND_DOT: Record<CalEventKind, string> = {
  exam: 'bg-amber',
  study: 'bg-accent',
  deadline: 'bg-danger',
}

export function DayAgenda({ date, items }: { date: Date; items: CalendarItem[] }) {
  const iso = toISODate(date)

  return (
    <div>
      <p className="mb-3 font-serif text-lg font-semibold text-heading">
        {format(date, 'EEE d MMM')}
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-muted">No events this day.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {items.map((it) => (
            <div
              key={it.key}
              className="group flex items-center gap-2.5 rounded-md px-1 py-1.5"
            >
              <span className={cn('h-2 w-2 flex-shrink-0 rounded-full', KIND_DOT[it.kind])} />
              <span className="flex-1 truncate text-sm text-ink">{it.title}</span>
              {it.eventId !== undefined && (
                <button
                  onClick={() => deleteEvent(it.eventId!)}
                  className="flex-shrink-0 rounded p-0.5 text-muted opacity-0 transition hover:bg-surface-2 hover:text-ink group-hover:opacity-100"
                  aria-label="Delete event"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 border-t border-line pt-3">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
          To-do
        </p>
        <TodoList date={iso} emptyText="No tasks for this day." />
      </div>
    </div>
  )
}

import { isSameDay, isSameMonth, isToday } from 'date-fns'
import { cn } from '@/lib/utils'
import { toISODate } from '@/lib/dates'
import { buildMonthMatrix, WEEKDAY_LABELS } from './calendarGrid'
import type { CalendarItem } from './useEvents'
import type { CalEventKind } from '@/db/types'

const KIND_CHIP: Record<CalEventKind, string> = {
  exam: 'bg-amber-tint text-amber',
  study: 'bg-accent-tint text-accent',
  deadline: 'bg-danger-tint text-danger-text',
}

interface Props {
  month: Date
  selected: Date
  onSelect: (day: Date) => void
  items: CalendarItem[]
}

export function Calendar({ month, selected, onSelect, items }: Props) {
  const days = buildMonthMatrix(month)

  const byDate = new Map<string, CalendarItem[]>()
  for (const item of items) {
    if (!byDate.has(item.date)) byDate.set(item.date, [])
    byDate.get(item.date)!.push(item)
  }

  return (
    <div className="flex flex-col">
      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-line pb-2">
        {WEEKDAY_LABELS.map((d, i) => (
          <div key={i} className="text-center text-[11px] font-semibold uppercase text-muted">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const iso = toISODate(day)
          const dayItems = byDate.get(iso) ?? []
          const inMonth = isSameMonth(day, month)
          const selectedDay = isSameDay(day, selected)
          const today = isToday(day)

          return (
            <button
              key={iso}
              onClick={() => onSelect(day)}
              className={cn(
                'flex min-h-[84px] flex-col gap-1 border-b border-r border-line p-1.5 text-left transition-colors',
                inMonth ? 'bg-surface' : 'bg-bg/40',
                selectedDay ? 'ring-2 ring-inset ring-accent' : 'hover:bg-surface-2',
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                  today ? 'bg-accent text-on-accent' : inMonth ? 'text-ink' : 'text-muted',
                )}
              >
                {day.getDate()}
              </span>

              <div className="flex flex-col gap-0.5">
                {dayItems.slice(0, 2).map((item) => (
                  <span
                    key={item.key}
                    className={cn(
                      'truncate rounded px-1 py-0.5 text-[10px] font-medium',
                      KIND_CHIP[item.kind],
                    )}
                    title={item.title}
                  >
                    {item.title}
                  </span>
                ))}
                {dayItems.length > 2 && (
                  <span className="pl-1 text-[10px] text-muted">+{dayItems.length - 2} more</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

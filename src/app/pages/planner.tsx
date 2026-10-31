import { useState } from 'react'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { daysUntil, toISODate } from '@/lib/dates'
import { Button } from '@/components/ui/Button'
import { Calendar } from '@/features/planner/Calendar'
import { AddEventDialog } from '@/features/planner/AddEventDialog'
import { DayAgenda } from '@/features/planner/DayAgenda'
import { ExamCountdowns } from '@/features/planner/ExamCountdowns'
import { useCalendarItems } from '@/features/planner/useEvents'
import { useUpcomingExams } from '@/features/planner/useUpcomingExams'
import { monthTitle, nextMonth, prevMonth } from '@/features/planner/calendarGrid'

export default function PlannerPage() {
  const [month, setMonth] = useState(() => new Date())
  const [selected, setSelected] = useState(() => new Date())
  const [addOpen, setAddOpen] = useState(false)

  const items = useCalendarItems()
  const upcoming = useUpcomingExams()
  const selectedIso = toISODate(selected)
  const dayItems = items.filter((i) => i.date === selectedIso)
  const firstExamDays = upcoming.length ? daysUntil(upcoming[0].examDate) : null

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header (fixed) */}
      <div className="flex-shrink-0 px-8 pb-6 pt-8">
        <div className="mx-auto flex max-w-6xl items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-heading">
              Planner
            </h1>
            <p className="mt-1 text-sm text-muted">
              Today is {format(new Date(), 'd MMM')}
              {firstExamDays !== null && ` · first exam in ${firstExamDays} days`}
            </p>
          </div>
          <Button onClick={() => setAddOpen(true)}>
            <Plus size={16} />
            Add event
          </Button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-auto px-8 pb-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="rounded-card border border-line bg-surface p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold text-heading">{monthTitle(month)}</h2>
              <div className="flex gap-1">
                <button
                  onClick={() => setMonth(prevMonth(month))}
                  className="flex h-8 w-8 items-center justify-center rounded-btn border border-line text-muted transition-colors hover:text-ink"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setMonth(nextMonth(month))}
                  className="flex h-8 w-8 items-center justify-center rounded-btn border border-line text-muted transition-colors hover:text-ink"
                  aria-label="Next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <Calendar month={month} selected={selected} onSelect={setSelected} items={items} />
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <div className="rounded-card border border-line bg-surface p-5 shadow-card">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
              Countdowns
            </h2>
            <ExamCountdowns />
          </div>

          <div className="rounded-card border border-line bg-surface p-5 shadow-card">
            <DayAgenda date={selected} items={dayItems} />
          </div>
        </div>
        </div>
      </div>

      <AddEventDialog
        key={addOpen ? selectedIso : 'closed'}
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultDate={selectedIso}
      />
    </div>
  )
}

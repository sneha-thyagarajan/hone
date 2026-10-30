import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { daysUntil } from '@/lib/dates'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useReadiness } from '@/features/folders/useReadiness'
import { useUpcomingExams } from './useUpcomingExams'
import type { Folder } from '@/db/types'

function ExamCountdownRow({ folder }: { folder: Folder }) {
  const navigate = useNavigate()
  const readiness = useReadiness(folder.id)
  const days = daysUntil(folder.examDate) ?? 0

  return (
    <button
      onClick={() => navigate(`/folders/${folder.id}`)}
      className="flex w-full flex-col gap-2 py-3 text-left transition-colors"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-sm font-semibold text-ink">{folder.name}</span>
        <span
          className={cn(
            'whitespace-nowrap text-sm font-bold',
            days <= 7 ? 'text-danger-text' : 'text-pink-text',
          )}
        >
          {days} {days === 1 ? 'day' : 'days'}
        </span>
      </div>
      <p className="text-[11px] text-muted">
        {format(new Date(folder.examDate!), 'EEE d MMM')} · readiness {readiness}%
      </p>
      <ProgressBar value={readiness} className="h-1.5" />
    </button>
  )
}

export function ExamCountdowns() {
  const exams = useUpcomingExams()

  if (exams.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted">
        No exam dates set yet. Add one from a folder's &ldquo;...&rdquo; menu.
      </p>
    )
  }

  return (
    <div className="divide-y divide-line">
      {exams.map((f) => (
        <ExamCountdownRow key={f.id} folder={f} />
      ))}
    </div>
  )
}

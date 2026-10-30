import { useNavigate } from 'react-router-dom'
import { FileText, CalendarClock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { daysUntil } from '@/lib/dates'
import { useFiles } from '@/features/files/useFiles'
import { useReadiness } from './useReadiness'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { Folder } from '@/db/types'

const KIND_LABEL: Record<string, string> = {
  theory: 'Theory',
  coding: 'Coding',
  mixed: 'Mixed',
}

export function FolderCard({ folder }: { folder: Folder }) {
  const navigate = useNavigate()
  const files = useFiles(folder.id)
  const readiness = useReadiness(folder.id)
  const days = daysUntil(folder.examDate)

  return (
    <button
      onClick={() => navigate(`/folders/${folder.id}`)}
      className="card-hover flex flex-col gap-4 rounded-card border border-line bg-surface p-5 text-left shadow-card"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="font-serif text-lg font-semibold leading-tight text-heading">{folder.name}</h3>
          <span className="w-fit rounded-full bg-pink px-2 py-0.5 text-[11px] font-bold text-[#243b39]">
            {KIND_LABEL[folder.kind]}
          </span>
        </div>
        {days !== null && (
          <span
            className={cn(
              'flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-semibold',
              days <= 7
                ? 'bg-danger-tint text-danger-text'
                : days <= 21
                  ? 'bg-amber-tint text-amber'
                  : 'bg-accent-tint text-accent',
            )}
          >
            <CalendarClock size={12} />
            {days > 0 ? `${days}d` : days === 0 ? 'Today' : 'Past'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted">
        <FileText size={13} />
        {files.length} {files.length === 1 ? 'file' : 'files'}
        {folder.examDate ? ' · exam set' : ' · no exam'}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">Readiness</span>
          <span className="font-semibold text-ink">{readiness}%</span>
        </div>
        <ProgressBar value={readiness} />
      </div>
    </button>
  )
}

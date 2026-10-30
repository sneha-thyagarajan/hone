import { useState } from 'react'
import { format } from 'date-fns'
import { Plus, FolderPlus, CalendarClock, Sparkles } from 'lucide-react'
import { useFolders } from '@/features/folders/useFolders'
import { FolderCard } from '@/features/folders/FolderCard'
import { CreateFolderDialog } from '@/features/folders/CreateFolderDialog'
import { useReadiness } from '@/features/folders/useReadiness'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { daysUntil } from '@/lib/dates'
import type { Folder } from '@/db/types'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function ExamRow({ folder }: { folder: Folder }) {
  const readiness = useReadiness(folder.id)
  const days = daysUntil(folder.examDate)
  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold text-ink">{folder.name}</span>
        <span className="whitespace-nowrap text-sm font-bold text-pink-text">
          {days !== null && days >= 0 ? `${days} days` : '—'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <ProgressBar value={readiness} className="h-1.5" />
        <span className="w-9 text-right text-[11px] text-muted">{readiness}%</span>
      </div>
      <p className="text-[11px] text-muted">
        {folder.examDate ? format(new Date(folder.examDate), 'EEE d MMM') : ''}
      </p>
    </div>
  )
}

export default function HomePage() {
  const folders = useFolders()
  const [createOpen, setCreateOpen] = useState(false)

  const upcoming = folders
    .filter((f) => f.examDate && (daysUntil(f.examDate) ?? -1) >= 0)
    .sort((a, b) => (daysUntil(a.examDate) ?? 0) - (daysUntil(b.examDate) ?? 0))

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-8 py-10">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">{format(new Date(), 'EEEE, d MMMM')}</p>
          <h1 className="mt-1 font-serif text-4xl font-semibold tracking-tight text-heading">
            {greeting()}
          </h1>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          New folder
        </Button>
      </div>

      {folders.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center gap-5 rounded-card border border-dashed border-line bg-surface/60 py-20 text-center">
          <div className="logo-mark flex h-14 w-14 items-center justify-center rounded-2xl shadow-glow">
            <FolderPlus size={26} className="text-cream" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-semibold text-heading">Create your first folder</h2>
            <p className="mt-1 max-w-sm text-sm text-muted">
              One folder per subject. Add notes, generate flashcards and quizzes, and track how
              ready you are for each exam.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            New folder
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Folder grid */}
          <div className="lg:col-span-2">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
              <Sparkles size={14} className="text-accent" />
              Your folders
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {folders.map((f) => (
                <FolderCard key={f.id} folder={f} />
              ))}
            </div>
          </div>

          {/* Upcoming exams */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
              <CalendarClock size={14} className="text-accent" />
              Upcoming exams
            </h2>
            <div className="rounded-card border border-line bg-surface p-5 shadow-card">
              {upcoming.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">
                  No exam dates set yet. Add one when you create or edit a folder.
                </p>
              ) : (
                <div className="divide-y divide-line">
                  {upcoming.map((f) => (
                    <ExamRow key={f.id} folder={f} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <CreateFolderDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, formatDistanceToNow } from 'date-fns'
import { Plus, FolderPlus, CalendarClock, Sparkles, PlayCircle, ListChecks } from 'lucide-react'
import { useFolders } from '@/features/folders/useFolders'
import { FolderCard } from '@/features/folders/FolderCard'
import { CreateFolderDialog } from '@/features/folders/CreateFolderDialog'
import { ExamCountdowns } from '@/features/planner/ExamCountdowns'
import { useContinueFile } from '@/features/files/useContinue'
import { TodoList } from '@/features/tasks/TodoList'
import { Button } from '@/components/ui/Button'
import { toISODate } from '@/lib/dates'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

const TYPE_LABEL: Record<string, string> = {
  note: 'Note',
  notes_ai: 'Note',
  code: 'Code practice',
  flashcards: 'Flashcards',
}

function ContinueCard() {
  const file = useContinueFile()
  const navigate = useNavigate()
  if (!file) return null

  return (
    <button
      onClick={() => navigate(`/folders/${file.folderId}/files/${file.id}`)}
      className="card-hover flex items-center justify-between gap-4 rounded-card border border-line bg-surface p-5 text-left shadow-card"
    >
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Continue</p>
        <h3 className="mt-1 truncate font-serif text-lg font-semibold text-heading">{file.name}</h3>
        <p className="mt-0.5 text-xs text-muted">
          {TYPE_LABEL[file.type] ?? 'File'} · opened{' '}
          {formatDistanceToNow(file.openedAt!, { addSuffix: true })}
        </p>
      </div>
      <span className="btn-primary flex items-center gap-1.5 rounded-btn px-4 py-2.5 text-sm font-semibold">
        <PlayCircle size={16} />
        Resume
      </span>
    </button>
  )
}

export default function HomePage() {
  const folders = useFolders()
  const [createOpen, setCreateOpen] = useState(false)
  const todayIso = toISODate(new Date())

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header (fixed) */}
      <div className="flex-shrink-0 px-8 pb-6 pt-10">
        <div className="mx-auto flex max-w-6xl items-end justify-between gap-4">
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
      </div>

      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-auto px-8 pb-10">
        <div className="mx-auto max-w-6xl">
          {folders.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center gap-5 rounded-card border border-dashed border-line bg-surface/60 py-20 text-center">
              <div className="logo-mark flex h-14 w-14 items-center justify-center rounded-2xl shadow-glow">
                <FolderPlus size={26} className="text-cream" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-semibold text-heading">
                  Create your first folder
                </h2>
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
              {/* Left column */}
              <div className="flex flex-col gap-6 lg:col-span-2">
                <ContinueCard />

                {/* Today's plan */}
                <div className="rounded-card border border-line bg-surface p-5 shadow-card">
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
                    <ListChecks size={14} className="text-accent" />
                    Today's plan
                  </h2>
                  <TodoList date={todayIso} emptyText="Nothing planned for today — add a task below." />
                </div>

                {/* Folders */}
                <div>
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
              </div>

              {/* Right column */}
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
                  <CalendarClock size={14} className="text-accent" />
                  Upcoming exams
                </h2>
                <div className="rounded-card border border-line bg-surface p-5 shadow-card">
                  <ExamCountdowns />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateFolderDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}

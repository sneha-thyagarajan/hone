import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { daysUntil } from '@/lib/dates'
import { useFolder } from '@/features/folders/useFolders'
import { useFiles } from '@/features/files/useFiles'
import { useReadiness } from '@/features/folders/useReadiness'
import { NewFileMenu } from '@/features/files/NewFileMenu'
import { FILE_TYPE_META, FILTER_TABS, type FilterTab } from '@/features/files/fileMeta'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { HoneFile } from '@/db/types'

const KIND_LABEL: Record<string, string> = {
  theory: 'Theory subject',
  coding: 'Coding subject',
  mixed: 'Mixed',
}

function FileBadge({ type }: { type: HoneFile['type'] }) {
  const meta = FILE_TYPE_META[type]
  const label = type === 'upload' ? 'FILE' : meta.label
  return (
    <span
      className={cn(
        'flex h-7 w-12 flex-shrink-0 items-center justify-center rounded-md text-[10px] font-bold tracking-wide',
        meta.color,
      )}
    >
      {label}
    </span>
  )
}

function FileRow({ file }: { file: HoneFile }) {
  const navigate = useNavigate()
  const { folderId } = useParams()

  const subtitle = (() => {
    if (file.type === 'flashcards') {
      const count = (file.meta?.cardCount as number | undefined) ?? 0
      return count ? `${count} cards` : null
    }
    if (file.type === 'quiz' || file.type === 'mock') {
      const count = (file.meta?.questionCount as number | undefined) ?? 0
      return count ? `${count} questions` : null
    }
    return null
  })()

  return (
    <button
      onClick={() => navigate(`/folders/${folderId}/files/${file.id}`)}
      className="group flex min-h-[58px] w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition-colors last:border-0 hover:bg-surface-2"
    >
      <FileBadge type={file.type} />
      <div className="flex flex-1 flex-col">
        <span className="truncate text-sm font-semibold text-ink">{file.name}</span>
        {subtitle && <span className="text-xs text-muted">{subtitle}</span>}
      </div>
      <span className="text-xs text-muted">
        {formatDistanceToNow(file.updatedAt, { addSuffix: true })}
      </span>
      <ChevronRight size={16} className="text-line transition-colors group-hover:text-muted" />
    </button>
  )
}

function StatCard({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 rounded-card border border-line bg-surface p-5 shadow-card">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </span>
      {children}
    </div>
  )
}

export default function FolderWorkspacePage() {
  const { folderId } = useParams()
  const id = folderId ? Number(folderId) : undefined
  const folder = useFolder(id)
  const allFiles = useFiles(id)
  const readiness = useReadiness(id)
  const [filter, setFilter] = useState<FilterTab>('all')

  const filteredFiles =
    filter === 'all'
      ? allFiles
      : allFiles.filter((f) => FILE_TYPE_META[f.type].filter === filter)

  const days = folder ? daysUntil(folder.examDate) : null

  if (!folder) {
    return <div className="flex flex-1 items-center justify-center text-muted">Folder not found.</div>
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted">Folders / {folder.name}</p>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-heading">
              {folder.name}
            </h1>
            <span className="rounded-full bg-pink px-2.5 py-1 text-xs font-bold text-[#243b39]">
              {KIND_LABEL[folder.kind]}
            </span>
            {days !== null && (
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-semibold',
                  days <= 7
                    ? 'bg-danger-tint text-danger-text'
                    : days <= 21
                      ? 'bg-amber-tint text-amber'
                      : 'bg-accent-tint text-accent',
                )}
              >
                {days > 0 ? `Exam · ${days} days` : days === 0 ? 'Exam today!' : 'Exam passed'}
              </span>
            )}
          </div>
        </div>
        <NewFileMenu folderId={folder.id!} />
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Readiness">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-semibold text-ink">{readiness}%</span>
          </div>
          <ProgressBar value={readiness} />
        </StatCard>
        <StatCard label="Files">
          <span className="font-serif text-3xl font-semibold text-ink">{allFiles.length}</span>
          <span className="text-xs text-muted">in this folder</span>
        </StatCard>
        <StatCard label="Exam">
          <span className="font-serif text-3xl font-semibold text-ink">
            {days !== null && days >= 0 ? days : '—'}
            {days !== null && days >= 0 && <span className="ml-1 text-base text-muted">days</span>}
          </span>
          <span className="text-xs text-muted">
            {folder.examDate ? 'until exam' : 'no date set'}
          </span>
        </StatCard>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => {
          const count =
            tab.key === 'all'
              ? allFiles.length
              : allFiles.filter((f) => FILE_TYPE_META[f.type].filter === tab.key).length
          const active = filter === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-accent text-on-accent'
                  : 'border border-line bg-surface text-muted hover:text-ink',
              )}
            >
              {tab.label}
              <span
                className={cn(
                  'rounded-full px-1.5 text-[10px] font-semibold',
                  active ? 'bg-black/20 text-on-accent' : 'bg-line text-muted',
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* File list */}
      <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
        {filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-16 text-muted">
            <p className="text-sm font-medium">No files here yet.</p>
            <p className="text-xs">Use &ldquo;+ New file&rdquo; to add one.</p>
          </div>
        ) : (
          filteredFiles.map((f) => <FileRow key={f.id} file={f} />)
        )}
      </div>
    </div>
  )
}

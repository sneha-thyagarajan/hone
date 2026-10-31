import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { ChevronRight, UploadCloud, Inbox, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { daysUntil } from '@/lib/dates'
import { useFolder } from '@/features/folders/useFolders'
import { useFiles } from '@/features/files/useFiles'
import { useReadiness } from '@/features/folders/useReadiness'
import { NewFileMenu } from '@/features/files/NewFileMenu'
import { FolderActionsMenu } from '@/features/folders/FolderActionsMenu'
import { useUploadStore } from '@/features/files/upload/uploadStore'
import { FILE_TYPE_META, FILTER_TABS, type FilterTab } from '@/features/files/fileMeta'
import { getAllowedTools } from '@/features/folders/tools'
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
  const [dragging, setDragging] = useState(false)
  const startUploads = useUploadStore((s) => s.startUploads)

  const filteredFiles =
    filter === 'all'
      ? allFiles
      : allFiles.filter((f) => FILE_TYPE_META[f.type].filter === filter)

  const days = folder ? daysUntil(folder.examDate) : null

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (!id) return
    const files = Array.from(e.dataTransfer.files)
    if (files.length) startUploads(id, files)
  }

  if (!folder) {
    return <div className="flex flex-1 items-center justify-center text-muted">Folder not found.</div>
  }

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col"
      onDragOver={(e) => {
        e.preventDefault()
        if (!dragging) setDragging(true)
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragging(false)
      }}
      onDrop={onDrop}
    >
      {dragging && (
        <div className="pointer-events-none absolute inset-4 z-30 flex flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed border-accent bg-accent-tint/60 backdrop-blur-sm">
          <UploadCloud size={32} className="text-accent" />
          <p className="font-serif text-lg font-semibold text-heading">Drop files to upload</p>
          <p className="text-sm text-muted">PDF, PPTX, DOCX, Markdown or TXT</p>
        </div>
      )}

      {/* Header (fixed) */}
      <div className="flex-shrink-0 px-8 pb-6 pt-8">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-4">
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
          <div className="flex items-center gap-2">
            <FolderActionsMenu folder={folder} variant="page" />
            <NewFileMenu folderId={folder.id!} kind={folder.kind} />
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-auto px-8 pb-8">
        <div className="mx-auto max-w-6xl">
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
                {days !== null && days >= 0 && (
                  <span className="ml-1 text-base text-muted">days</span>
                )}
              </span>
              <span className="text-xs text-muted">
                {folder.examDate ? 'until exam' : 'no date set'}
              </span>
            </StatCard>
          </div>

          {/* Filter tabs */}
          <div className="mb-4 flex flex-wrap gap-2">
            {FILTER_TABS.filter((tab) => {
              const tools = getAllowedTools(folder.kind)
              if (tab.key === 'practice') return tools.practiceTab
              if (tab.key === 'notes') return tools.notesTab
              return true
            }).map((tab) => {
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
              allFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <Inbox size={28} className="text-muted" />
                  <div>
                    <p className="text-sm font-medium text-ink">This folder is empty</p>
                    <p className="mt-1 text-xs text-muted">
                      Upload a file, write a note, or drag files here to get started.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <Filter size={26} className="text-muted" />
                  <div>
                    <p className="text-sm font-medium text-ink">
                      No {FILTER_TABS.find((t) => t.key === filter)?.label.toLowerCase()} files
                    </p>
                    <p className="mt-1 text-xs text-muted">Try a different tab or add one.</p>
                  </div>
                </div>
              )
            ) : (
              filteredFiles.map((f) => <FileRow key={f.id} file={f} />)
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { daysUntil } from '@/lib/dates'
import { useFolder } from '@/features/folders/useFolders'
import { useFiles } from '@/features/files/useFiles'
import { NewFileMenu } from '@/features/files/NewFileMenu'
import { FILE_TYPE_META, FILTER_TABS, type FilterTab } from '@/features/files/fileMeta'
import type { HoneFile } from '@/db/types'

const KIND_LABEL: Record<string, string> = {
  theory: 'Theory',
  coding: 'Coding subject',
  mixed: 'Mixed',
}

function FileBadge({ type }: { type: HoneFile['type'] }) {
  const meta = FILE_TYPE_META[type]
  const label = type === 'upload' ? 'FILE' : meta.label
  return (
    <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold', meta.color)}>
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
      return count ? `${count} cards` : 'No cards yet'
    }
    if (file.type === 'quiz' || file.type === 'mock') {
      const count = (file.meta?.questionCount as number | undefined) ?? 0
      return count ? `${count} questions` : 'No questions yet'
    }
    if (file.type === 'code') return 'Code practice'
    return null
  })()

  const timeLabel = formatDistanceToNow(file.updatedAt, { addSuffix: true })

  return (
    <button
      onClick={() => navigate(`/folders/${folderId}/files/${file.id}`)}
      className="flex min-h-[52px] w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition-colors last:border-0 hover:bg-bg"
    >
      <FileBadge type={file.type} />
      <span className="flex-1 truncate text-sm font-medium text-ink">{file.name}</span>
      {subtitle && <span className="text-xs text-muted">{subtitle} · </span>}
      <span className="text-xs text-muted">{timeLabel}</span>
    </button>
  )
}

export default function FolderWorkspacePage() {
  const { folderId } = useParams()
  const id = folderId ? Number(folderId) : undefined
  const folder = useFolder(id)
  const allFiles = useFiles(id)
  const [filter, setFilter] = useState<FilterTab>('all')

  const filteredFiles =
    filter === 'all'
      ? allFiles
      : allFiles.filter((f) => FILE_TYPE_META[f.type].filter === filter)

  const days = folder ? daysUntil(folder.examDate) : null

  if (!folder) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted">
        Folder not found.
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-line px-6 py-4">
        <div className="flex flex-1 flex-col gap-1">
          <p className="text-xs text-muted">Folders / {folder.name}</p>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-semibold text-ink">{folder.name}</h1>
            <span className="rounded-btn bg-accent-tint px-2 py-0.5 text-xs font-medium text-accent">
              {KIND_LABEL[folder.kind]}
            </span>
            {days !== null && (
              <span
                className={cn(
                  'rounded-btn px-2 py-0.5 text-xs font-semibold',
                  days <= 7
                    ? 'bg-danger-tint text-danger-text'
                    : days <= 21
                      ? 'bg-amber-tint text-amber'
                      : 'bg-amber-tint text-amber',
                )}
              >
                {days > 0 ? `${days} days` : days === 0 ? 'Today!' : 'Past'}
              </span>
            )}
          </div>
        </div>
        <NewFileMenu folderId={folder.id!} />
      </div>

      {/* File list */}
      <div className="flex flex-1 gap-6 p-6">
        <div className="flex flex-1 flex-col">
          {/* Filter tabs */}
          <div className="mb-3 flex gap-1 border-b border-line">
            {FILTER_TABS.map((tab) => {
              const count =
                tab.key === 'all'
                  ? allFiles.length
                  : allFiles.filter((f) => FILE_TYPE_META[f.type].filter === tab.key).length
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    'flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                    filter === tab.key
                      ? '-mb-px border-accent text-accent'
                      : 'border-transparent text-muted hover:text-ink',
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      'rounded-full px-1.5 text-[10px]',
                      filter === tab.key ? 'bg-accent-tint text-accent' : 'bg-line text-muted',
                    )}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* File rows */}
          <div className="rounded-card border border-line bg-white shadow-card">
            {filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted">
                <p className="text-sm">No files here yet.</p>
                <p className="text-xs">Use "+ New file" to add one.</p>
              </div>
            ) : (
              filteredFiles.map((f) => <FileRow key={f.id} file={f} />)
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

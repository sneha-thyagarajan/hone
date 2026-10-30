import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import { Trash2, Check, Loader2, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFile } from '@/features/files/useFiles'
import { deleteFile, renameFile } from '@/features/files/fileActions'
import { useMarkdownEditor } from '@/features/notes/useMarkdownEditor'
import { useAutosave } from '@/features/notes/useAutosave'

function SaveStatusBadge({ status }: { status: 'idle' | 'saving' | 'saved' }) {
  if (status === 'idle') return <span className="text-xs text-muted">Autosaves</span>
  return (
    <span className="flex items-center gap-1 text-xs text-muted">
      {status === 'saving' ? (
        <>
          <Loader2 size={12} className="animate-spin" />
          Saving…
        </>
      ) : (
        <>
          <Check size={12} className="text-success" />
          Saved
        </>
      )}
    </span>
  )
}

function InlineRename({ name, fileId }: { name: string; fileId: number }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)

  async function commit() {
    const trimmed = value.trim()
    if (trimmed && trimmed !== name) await renameFile(fileId, trimmed)
    else setValue(name)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') {
            setValue(name)
            setEditing(false)
          }
        }}
        className="rounded-md border border-accent px-2 py-0.5 font-serif text-xl font-semibold text-heading outline-none focus:ring-2 focus:ring-accent/20"
        style={{ minWidth: '12rem' }}
      />
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="rounded-md px-1.5 py-0.5 font-serif text-xl font-semibold text-heading transition-colors hover:bg-line"
      title="Click to rename"
    >
      {name}
    </button>
  )
}

export default function NoteEditorPage() {
  const { folderId, fileId } = useParams()
  const navigate = useNavigate()
  const file = useFile(fileId ? Number(fileId) : undefined)
  const { save, status } = useAutosave(file?.id)

  const editorRef = useMarkdownEditor({
    initialValue: file?.content ?? '',
    onChange: save,
  })

  const [view, setView] = useState<'split' | 'edit' | 'preview'>('split')

  async function handleDelete() {
    if (!file) return
    if (!window.confirm(`Delete "${file.name}"? This cannot be undone.`)) return
    await deleteFile(file.id!)
    navigate(`/folders/${folderId}`)
  }

  if (!file) {
    return <div className="flex flex-1 items-center justify-center text-muted">File not found.</div>
  }

  if (file.type !== 'note' && file.type !== 'notes_ai') {
    return (
      <div className="flex flex-1 items-center justify-center text-muted">
        This file type has no editor yet.
      </div>
    )
  }

  const showEditor = view !== 'preview'
  const showPreview = view !== 'edit'

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex min-h-[60px] items-center gap-3 border-b border-line bg-surface/70 px-6 backdrop-blur">
        <button
          onClick={() => navigate(`/folders/${folderId}`)}
          className="flex h-8 w-8 items-center justify-center rounded-btn text-muted transition-colors hover:bg-line hover:text-ink"
          aria-label="Back to folder"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex flex-1 items-center gap-2.5">
          <InlineRename name={file.name} fileId={file.id!} />
          <SaveStatusBadge status={status} />
        </div>

        {/* View switcher */}
        <div className="flex rounded-btn border border-line bg-surface p-0.5 text-xs font-medium">
          {(['edit', 'split', 'preview'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'rounded-[8px] px-3 py-1.5 capitalize transition-colors',
                view === v ? 'bg-accent text-on-accent' : 'text-muted hover:text-ink',
              )}
            >
              {v}
            </button>
          ))}
        </div>

        <button
          onClick={handleDelete}
          className="flex min-h-[36px] items-center gap-1.5 rounded-btn px-3 text-sm font-medium text-danger-text transition-colors hover:bg-danger-tint"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>

      {/* Editor + Preview */}
      <div className="flex flex-1 overflow-hidden">
        {showEditor && (
          <div
            ref={editorRef}
            className={cn(
              'h-full overflow-auto bg-surface',
              showPreview ? 'w-1/2 border-r border-line' : 'w-full',
            )}
          />
        )}

        {showPreview && (
          <div
            className={cn(
              'h-full overflow-auto bg-bg px-8 py-6',
              showEditor ? 'w-1/2' : 'mx-auto w-full max-w-3xl',
            )}
          >
            {(file.content ?? '').trim() ? (
              <div className="markdown-body">
                <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{file.content ?? ''}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm italic text-muted">
                Nothing to preview yet. Start writing on the left.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

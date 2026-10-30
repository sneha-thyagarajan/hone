import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import { Trash2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFile } from '@/features/files/useFiles'
import { deleteFile, renameFile } from '@/features/files/fileActions'
import { useMarkdownEditor } from '@/features/notes/useMarkdownEditor'
import { useAutosave } from '@/features/notes/useAutosave'

function SaveStatusBadge({ status }: { status: 'idle' | 'saving' | 'saved' }) {
  if (status === 'idle') return null
  return (
    <span className="flex items-center gap-1 text-xs text-muted">
      {status === 'saving' ? (
        'Saving…'
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
    else setValue(name) // revert if blank or unchanged
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
          if (e.key === 'Escape') { setValue(name); setEditing(false) }
        }}
        className="rounded border border-accent px-2 py-0.5 font-serif text-2xl font-semibold text-ink outline-none focus:ring-2 focus:ring-accent/20"
        style={{ minWidth: '12rem' }}
      />
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="rounded px-1 font-serif text-2xl font-semibold text-ink hover:bg-line"
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

  const [preview, setPreview] = useState(true)

  async function handleDelete() {
    if (!file) return
    if (!window.confirm(`Delete "${file.name}"? This cannot be undone.`)) return
    await deleteFile(file.id!)
    navigate(`/folders/${folderId}`)
  }

  if (!file) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted">
        File not found.
      </div>
    )
  }

  if (file.type !== 'note') {
    return (
      <div className="flex flex-1 items-center justify-center text-muted">
        This file type has no editor yet.
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex min-h-[56px] items-center gap-3 border-b border-line px-6">
        <div className="flex flex-1 items-center gap-2">
          <InlineRename name={file.name} fileId={file.id!} />
          <SaveStatusBadge status={status} />
        </div>

        <div className="flex items-center gap-2">
          {/* Preview toggle */}
          <div className="flex rounded-btn border border-line text-xs font-medium">
            <button
              onClick={() => setPreview(false)}
              className={cn(
                'rounded-l-btn px-3 py-1.5 transition-colors',
                !preview ? 'bg-accent text-white' : 'text-muted hover:bg-bg',
              )}
            >
              Edit
            </button>
            <button
              onClick={() => setPreview(true)}
              className={cn(
                'rounded-r-btn px-3 py-1.5 transition-colors',
                preview ? 'bg-accent text-white' : 'text-muted hover:bg-bg',
              )}
            >
              Preview
            </button>
            <button
              onClick={() => setPreview((v) => !v)}
              className="hidden"
              aria-label="Toggle preview"
            />
          </div>

          <button
            onClick={handleDelete}
            className="flex min-h-[36px] items-center gap-1.5 rounded-btn px-3 text-sm font-medium text-danger-text transition-colors hover:bg-danger-tint"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      {/* Editor + Preview */}
      <div className="flex flex-1 overflow-hidden">
        {/* CodeMirror editor */}
        <div
          ref={editorRef}
          className={cn(
            'h-full overflow-auto border-r border-line bg-white',
            preview ? 'w-1/2' : 'w-full',
          )}
        />

        {/* Markdown preview */}
        {preview && (
          <div className="prose prose-sm h-full w-1/2 max-w-none overflow-auto p-6 font-sans text-ink">
            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{file.content ?? ''}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}

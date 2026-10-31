import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkBreaks from 'remark-breaks'
import {
  Trash2,
  Check,
  Loader2,
  ArrowLeft,
  Bold,
  Italic,
  Heading2,
  List,
  Code2,
  ListTree,
  Search,
  WrapText,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { db } from '@/db'
import { useFile } from '@/features/files/useFiles'
import { useFolder } from '@/features/folders/useFolders'
import { deleteFile, renameFile } from '@/features/files/fileActions'
import { useMarkdownEditor } from '@/features/notes/useMarkdownEditor'
import { useAutosave } from '@/features/notes/useAutosave'
import {
  countWords,
  toggleHeading,
  toggleList,
  toggleWrap,
  type EditState,
} from '@/features/notes/markdownCommands'
import {
  activeOutlineIndex,
  extractOutline,
  proportionalScrollTop,
  type OutlineItem,
} from '@/features/notes/outline'
import { useSetting } from '@/lib/settings'
import { useDebounced } from '@/lib/useDebounced'
import type { HoneFile } from '@/db/types'

type ViewMode = 'edit' | 'split' | 'preview'

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
          <Check size={12} className="text-success-text" />
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
      className="truncate rounded-md px-1.5 py-0.5 font-serif text-xl font-semibold text-heading transition-colors hover:bg-surface-2"
      title="Click to rename"
    >
      {name}
    </button>
  )
}

function FmtButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // keep editor selection
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-ink"
    >
      {children}
    </button>
  )
}

function OutlinePanel({
  outline,
  activeIndex,
  onPick,
  onClose,
}: {
  outline: OutlineItem[]
  activeIndex: number
  onPick: (index: number) => void
  onClose: () => void
}) {
  return (
    <div className="flex w-56 flex-shrink-0 flex-col border-r border-line bg-surface">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-line px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
          Outline
        </span>
        <button
          onClick={onClose}
          aria-label="Hide outline"
          className="rounded p-0.5 text-muted hover:bg-surface-2 hover:text-ink"
        >
          <X size={13} />
        </button>
      </div>
      <nav className="min-h-0 flex-1 overflow-auto p-2">
        {outline.length === 0 ? (
          <p className="px-2 py-2 text-xs text-muted">No headings on this page. Start a line with #.</p>
        ) : (
          outline.map((h, i) => (
            <button
              key={`${h.line}-${i}`}
              onClick={() => onPick(i)}
              style={{ paddingLeft: (h.level - 1) * 12 + 8 }}
              className={cn(
                'block w-full truncate rounded px-2 py-1 text-left text-xs transition-colors',
                i === activeIndex
                  ? 'bg-accent-tint font-medium text-accent'
                  : 'text-muted hover:bg-surface-2 hover:text-ink',
              )}
            >
              {h.text}
            </button>
          ))
        )}
      </nav>
    </div>
  )
}

function initialPages(file: HoneFile): string[] {
  const p = file.meta?.pages
  if (Array.isArray(p) && p.length) return p as string[]
  return [file.content ?? '']
}

function NoteEditorBody({ file, folderId }: { file: HoneFile; folderId?: string }) {
  const navigate = useNavigate()
  const folder = useFolder(file.folderId)
  const { save, status } = useAutosave(file.id)

  const [pages, setPages] = useState<string[]>(() => initialPages(file))
  const [pageIdx, setPageIdx] = useState(() => {
    const a = file.meta?.activePage
    return typeof a === 'number' && a >= 0 && a < pages.length ? a : 0
  })
  const [view, setView] = useState<ViewMode>('split')
  const [showOutline, setShowOutline] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [keepLineBreaks, setKeepLineBreaks] = useSetting('note.keepLineBreaks', true)

  const previewRef = useRef<HTMLDivElement>(null)
  const headingsRef = useRef<HTMLElement[]>([])
  const scrollLock = useRef<'editor' | 'preview' | null>(null)
  const metaTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const idx = Math.min(pageIdx, pages.length - 1) // clamp defensively
  const current = pages[idx] ?? ''
  const outline = useMemo(() => extractOutline(current), [current])
  const debouncedCurrent = useDebounced(current, 200)
  const words = countWords(current)

  function persistMeta(nextPages: string[], nextActive: number) {
    if (metaTimer.current) clearTimeout(metaTimer.current)
    metaTimer.current = setTimeout(() => {
      db.files.update(file.id!, {
        meta: { ...(file.meta ?? {}), pages: nextPages, activePage: nextActive },
      })
    }, 400)
  }

  const { containerRef, applyEdit, scrollToLine, openFind, getScrollDOM } = useMarkdownEditor({
    value: current,
    resetKey: idx,
    placeholder: 'Start writing in Markdown…',
    onChange: (v) => {
      const next = [...pages]
      next[idx] = v
      setPages(next)
      save(next.join('\n\n'))
      persistMeta(next, idx)
    },
    onScrollLine: (topLine) => {
      if (view !== 'preview') setActiveIndex(activeOutlineIndex(outline, topLine - 1))
    },
  })

  function goToPage(i: number) {
    const clamped = Math.max(0, Math.min(i, pages.length - 1))
    setPageIdx(clamped)
    setActiveIndex(-1)
    persistMeta(pages, clamped)
  }

  function addPage() {
    const next = [...pages, '']
    const i = next.length - 1
    setPages(next)
    setPageIdx(i)
    setActiveIndex(-1)
    save(next.join('\n\n'))
    persistMeta(next, i)
  }

  function deletePage() {
    if (pages.length <= 1) return
    if (!window.confirm(`Delete page ${idx + 1}? This can't be undone.`)) return
    const next = pages.filter((_, i) => i !== idx)
    const i = Math.max(0, idx - 1)
    setPages(next)
    setPageIdx(i)
    setActiveIndex(-1)
    save(next.join('\n\n'))
    persistMeta(next, i)
  }

  // Tag preview headings after each (debounced) render so the outline can scroll to them.
  useEffect(() => {
    const el = previewRef.current
    if (!el) return
    const hs = Array.from(el.querySelectorAll('h1,h2,h3,h4,h5,h6')) as HTMLElement[]
    hs.forEach((h, i) => (h.id = `outline-${i}`))
    headingsRef.current = hs
  }, [debouncedCurrent, view, idx])

  // Sync editor <-> preview scroll in Split mode.
  useEffect(() => {
    const el = getScrollDOM()
    if (!el || view !== 'split') return
    const handler = () => {
      if (scrollLock.current === 'preview') return
      const pv = previewRef.current
      if (!pv) return
      scrollLock.current = 'editor'
      pv.scrollTop = proportionalScrollTop({
        sourceScrollTop: el.scrollTop,
        sourceScrollHeight: el.scrollHeight,
        sourceClientHeight: el.clientHeight,
        targetScrollHeight: pv.scrollHeight,
        targetClientHeight: pv.clientHeight,
      })
      requestAnimationFrame(() => (scrollLock.current = null))
    }
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
  }, [getScrollDOM, view, idx])

  function onPreviewScroll() {
    const pv = previewRef.current
    if (!pv) return
    if (view === 'preview') {
      let i = -1
      headingsRef.current.forEach((h, n) => {
        if (h.offsetTop - pv.scrollTop <= 4) i = n
      })
      setActiveIndex(i)
    }
    if (view !== 'split' || scrollLock.current === 'editor') return
    const el = getScrollDOM()
    if (!el) return
    scrollLock.current = 'preview'
    el.scrollTop = proportionalScrollTop({
      sourceScrollTop: pv.scrollTop,
      sourceScrollHeight: pv.scrollHeight,
      sourceClientHeight: pv.clientHeight,
      targetScrollHeight: el.scrollHeight,
      targetClientHeight: el.clientHeight,
    })
    requestAnimationFrame(() => (scrollLock.current = null))
  }

  function pickHeading(i: number) {
    setActiveIndex(i)
    scrollToLine(outline[i].line + 1)
    const pv = previewRef.current
    const h = headingsRef.current[i]
    if (pv && h) pv.scrollTop = h.offsetTop
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${file.name}"? This cannot be undone.`)) return
    await deleteFile(file.id!)
    navigate(`/folders/${folderId}`)
  }

  const showEditor = view !== 'preview'
  const showPreview = view !== 'edit'

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Toolbar (fixed) */}
      <div className="flex min-h-[60px] flex-shrink-0 items-center gap-3 border-b border-line bg-surface/70 px-6 backdrop-blur">
        <button
          onClick={() => navigate(`/folders/${folderId}`)}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-btn text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          aria-label="Back to folder"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex min-w-0 flex-1 flex-col">
          <button
            onClick={() => navigate(`/folders/${folderId}`)}
            className="w-fit text-xs font-medium text-muted transition-colors hover:text-ink"
          >
            {folder?.name ?? 'Folder'} / Note
          </button>
          <div className="flex items-center gap-2.5">
            <InlineRename name={file.name} fileId={file.id!} />
            <SaveStatusBadge status={status} />
            <span className="whitespace-nowrap text-xs text-muted">
              · {words} {words === 1 ? 'word' : 'words'}
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowOutline((v) => !v)}
          title="Outline"
          aria-label="Toggle outline"
          aria-pressed={showOutline}
          className={cn(
            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-btn transition-colors',
            showOutline ? 'bg-accent-tint text-accent' : 'text-muted hover:bg-surface-2 hover:text-ink',
          )}
        >
          <ListTree size={16} />
        </button>

        <button
          onClick={openFind}
          title="Find in note (Ctrl/Cmd+F)"
          aria-label="Find in note"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-btn text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <Search size={15} />
        </button>

        <div className="flex flex-shrink-0 rounded-btn border border-line bg-surface p-0.5 text-xs font-medium">
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
          className="flex min-h-[36px] flex-shrink-0 items-center gap-1.5 rounded-btn px-3 text-sm font-medium text-danger-text transition-colors hover:bg-danger-tint"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>

      {/* Secondary toolbar (sticky): pages, formatting, preview options */}
      <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-line bg-surface/40 px-5 py-1.5">
        <div className="flex items-center gap-2">
          {/* Page controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(idx - 1)}
              disabled={idx === 0}
              aria-label="Previous page"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="whitespace-nowrap px-1 text-xs font-medium text-ink">
              Page {idx + 1} / {pages.length}
            </span>
            <button
              onClick={() => goToPage(idx + 1)}
              disabled={idx >= pages.length - 1}
              aria-label="Next page"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={addPage}
              title="Add page"
              aria-label="Add page"
              className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <Plus size={14} />
              Add page
            </button>
            {pages.length > 1 && (
              <button
                onClick={deletePage}
                title="Delete this page"
                aria-label="Delete page"
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-danger-tint hover:text-danger-text"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>

          {showEditor && (
            <>
              <span className="h-5 w-px bg-line" />
              <div className="flex items-center gap-0.5">
                <FmtButton label="Bold" onClick={() => applyEdit((s: EditState) => toggleWrap(s, '**'))}>
                  <Bold size={15} />
                </FmtButton>
                <FmtButton label="Italic" onClick={() => applyEdit((s: EditState) => toggleWrap(s, '*'))}>
                  <Italic size={15} />
                </FmtButton>
                <FmtButton label="Heading" onClick={() => applyEdit((s) => toggleHeading(s, 2))}>
                  <Heading2 size={15} />
                </FmtButton>
                <FmtButton label="Bullet list" onClick={() => applyEdit(toggleList)}>
                  <List size={15} />
                </FmtButton>
                <FmtButton
                  label="Inline code"
                  onClick={() => applyEdit((s: EditState) => toggleWrap(s, '`'))}
                >
                  <Code2 size={15} />
                </FmtButton>
              </div>
            </>
          )}
        </div>

        {showPreview && (
          <button
            onClick={() => setKeepLineBreaks(!keepLineBreaks)}
            aria-pressed={keepLineBreaks}
            className={cn(
              'flex flex-shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors',
              keepLineBreaks ? 'bg-accent-tint text-accent' : 'text-muted hover:bg-surface-2 hover:text-ink',
            )}
            title="Render single newlines as line breaks in the preview"
          >
            <WrapText size={13} />
            Keep line breaks
          </button>
        )}
      </div>

      {/* Panes */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {showOutline && (
          <OutlinePanel
            outline={outline}
            activeIndex={activeIndex}
            onPick={pickHeading}
            onClose={() => setShowOutline(false)}
          />
        )}

        {/* Editor pane */}
        <div
          ref={containerRef}
          className={cn(
            'h-full overflow-hidden bg-surface',
            view === 'edit' ? 'flex-1' : view === 'split' ? 'w-1/2 border-r border-line' : 'hidden',
          )}
        />

        {/* Preview pane */}
        <div
          ref={previewRef}
          onScroll={onPreviewScroll}
          className={cn(
            'relative h-full overflow-auto bg-bg px-8 py-6',
            view === 'preview' ? 'flex-1' : view === 'split' ? 'w-1/2' : 'hidden',
          )}
        >
          {debouncedCurrent.trim() ? (
            <div className="markdown-body mx-auto max-w-3xl">
              <ReactMarkdown
                remarkPlugins={keepLineBreaks ? [remarkBreaks] : []}
                rehypePlugins={[rehypeSanitize]}
              >
                {debouncedCurrent}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm italic text-muted">This page is empty. Start writing on the left.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function NoteEditorPage() {
  const { folderId, fileId } = useParams()
  const file = useFile(fileId ? Number(fileId) : undefined)

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

  return <NoteEditorBody key={file.id} file={file} folderId={folderId} />
}

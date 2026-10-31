import { useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import {
  Plus,
  X,
  Image as ImageIcon,
  FileText,
  Trash2,
  ChevronRight,
  PanelLeftClose,
  Upload,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBlobUrl } from '@/features/files/useBlobUrl'
import { storeImage, deleteImageBlobs } from './noteImages'
import {
  PROBLEM_TAB_ID,
  addTab,
  deleteTab,
  renameTab,
  reorderTab,
  setTabImages,
  setTabText,
  tabImageIds,
  type NoteTab,
  type NoteTabKind,
} from './noteTabs'

interface Props {
  tabs: NoteTab[]
  activeId: string
  onChange: (tabs: NoteTab[], activeId: string) => void
}

export function NotesPanel({ tabs, activeId, onChange }: Props) {
  const [width, setWidth] = useState(320)
  const [collapsed, setCollapsed] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const tabRefs = useRef(new Map<string, HTMLButtonElement>())
  const dragId = useRef<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const active = tabs.find((t) => t.id === activeId) ?? tabs[0]

  function handleAdd(kind: NoteTabKind) {
    setAdding(false)
    const { tabs: next, id } = addTab(tabs, kind)
    onChange(next, id)
  }

  async function handleDelete(id: string) {
    const tab = tabs.find((t) => t.id === id)
    if (!tab) return
    if (!window.confirm(`Delete the "${tab.title}" tab? This can't be undone.`)) return
    await deleteImageBlobs(tabImageIds(tab))
    onChange(deleteTab(tabs, id), activeId === id ? PROBLEM_TAB_ID : activeId)
  }

  function commitRename(id: string, title: string) {
    onChange(renameTab(tabs, id, title), activeId)
    setEditingId(null)
  }

  function onTabKeyDown(e: React.KeyboardEvent, index: number) {
    const keys: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tabs.length - 1,
    }
    const target = keys[e.key]
    if (target === undefined) return
    e.preventDefault()
    const next = tabs[(target + tabs.length) % tabs.length]
    onChange(tabs, next.id)
    tabRefs.current.get(next.id)?.focus()
  }

  function onDrop(targetId: string) {
    const from = dragId.current
    dragId.current = null
    if (!from || from === targetId) return
    const toIndex = tabs.findIndex((t) => t.id === targetId)
    onChange(reorderTab(tabs, from, toIndex), activeId)
  }

  function startResize(e: React.MouseEvent) {
    e.preventDefault()
    const startX = e.clientX
    const startW = width
    const move = (ev: MouseEvent) =>
      setWidth(Math.max(240, Math.min(560, startW + ev.clientX - startX)))
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  async function addImages(tabId: string, files: FileList | File[]) {
    const imgs = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (!imgs.length) return
    const ids: string[] = []
    for (const f of imgs) ids.push(await storeImage(f))
    const tab = tabs.find((t) => t.id === tabId)
    onChange(setTabImages(tabs, tabId, [...(tab?.images ?? []), ...ids]), activeId)
  }

  async function removeImage(tabId: string, blobId: string) {
    await deleteImageBlobs([blobId])
    const tab = tabs.find((t) => t.id === tabId)
    onChange(
      setTabImages(tabs, tabId, (tab?.images ?? []).filter((x) => x !== blobId)),
      activeId,
    )
  }

  if (collapsed) {
    return (
      <div className="flex w-10 flex-shrink-0 flex-col items-center gap-2 rounded-card border border-line bg-surface py-3 shadow-card">
        <button
          onClick={() => setCollapsed(false)}
          className="flex h-7 w-7 items-center justify-center rounded-btn text-muted hover:bg-surface-2 hover:text-ink"
          aria-label="Expand notes panel"
        >
          <ChevronRight size={16} />
        </button>
        <span className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted [writing-mode:vertical-rl]">
          Notes
        </span>
      </div>
    )
  }

  return (
    <div
      ref={panelRef}
      style={{ width }}
      className="relative flex flex-shrink-0 flex-col rounded-card border border-line bg-surface shadow-card"
    >
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-line px-2 py-1.5">
        <div role="tablist" aria-label="Notes tabs" className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {tabs.map((tab, i) => {
            const selected = tab.id === activeId
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  if (el) tabRefs.current.set(tab.id, el)
                  else tabRefs.current.delete(tab.id)
                }}
                role="tab"
                aria-selected={selected}
                aria-controls="notes-tabpanel"
                id={`notes-tab-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                draggable={tab.id !== PROBLEM_TAB_ID}
                onDragStart={() => (dragId.current = tab.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(tab.id)}
                onClick={() => onChange(tabs, tab.id)}
                onDoubleClick={() => setEditingId(tab.id)}
                onKeyDown={(e) => onTabKeyDown(e, i)}
                className={cn(
                  'group flex flex-shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent',
                  selected ? 'bg-accent-tint text-accent' : 'text-muted hover:bg-surface-2 hover:text-ink',
                )}
              >
                {tab.kind === 'image' ? <ImageIcon size={12} /> : <FileText size={12} />}
                {editingId === tab.id ? (
                  <input
                    autoFocus
                    defaultValue={tab.title}
                    onBlur={(e) => commitRename(tab.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename(tab.id, (e.target as HTMLInputElement).value)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-20 rounded border border-accent bg-surface px-1 text-xs text-ink outline-none"
                  />
                ) : (
                  <span className="max-w-[8rem] truncate">{tab.title}</span>
                )}
                {tab.id !== PROBLEM_TAB_ID && editingId !== tab.id && (
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(tab.id)
                    }}
                    className="ml-0.5 rounded p-0.5 opacity-0 hover:bg-danger-tint hover:text-danger-text group-hover:opacity-100"
                    aria-label={`Delete ${tab.title} tab`}
                  >
                    <X size={11} />
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Add tab */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setAdding((v) => !v)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-ink"
            aria-label="Add tab"
          >
            <Plus size={15} />
          </button>
          {adding && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setAdding(false)} />
              <div className="absolute right-0 z-20 mt-1 w-36 rounded-card border border-line bg-surface py-1 shadow-lg">
                <button
                  onClick={() => handleAdd('text')}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-ink hover:bg-surface-2"
                >
                  <FileText size={13} /> Text
                </button>
                <button
                  onClick={() => handleAdd('image')}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-ink hover:bg-surface-2"
                >
                  <ImageIcon size={13} /> Image
                </button>
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => setCollapsed(true)}
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-ink"
          aria-label="Collapse notes panel"
        >
          <PanelLeftClose size={15} />
        </button>
      </div>

      {/* Active panel */}
      <div
        role="tabpanel"
        id="notes-tabpanel"
        aria-labelledby={`notes-tab-${active?.id}`}
        tabIndex={0}
        className="min-h-0 flex-1 overflow-auto p-4 outline-none"
      >
        {active?.kind === 'image' ? (
          <ImageTabBody
            tab={active}
            onAdd={(files) => addImages(active.id, files)}
            onRemove={(id) => removeImage(active.id, id)}
            onOpen={setLightbox}
          />
        ) : (
          <TextTabBody
            key={active?.id}
            value={active?.text ?? ''}
            onChange={(v) => onChange(setTabText(tabs, active!.id, v), activeId)}
            isProblem={active?.id === PROBLEM_TAB_ID}
          />
        )}
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={startResize}
        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-accent/30"
        aria-hidden
      />

      {lightbox && <Lightbox blobId={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  )
}

function TextTabBody({
  value,
  onChange,
  isProblem,
}: {
  value: string
  onChange: (v: string) => void
  isProblem: boolean
}) {
  const [preview, setPreview] = useState(false)
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
          {isProblem ? 'Problem' : 'Notes'} · Markdown
        </span>
        <button
          onClick={() => setPreview((v) => !v)}
          className="rounded px-2 py-0.5 text-[11px] font-medium text-muted hover:bg-surface-2 hover:text-ink"
        >
          {preview ? 'Edit' : 'Preview'}
        </button>
      </div>
      {preview ? (
        <div className="markdown-body flex-1 overflow-auto text-sm">
          {value.trim() ? (
            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{value}</ReactMarkdown>
          ) : (
            <p className="italic text-muted">Nothing to preview.</p>
          )}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write the problem you're solving, or any notes…"
          className="min-h-[160px] flex-1 resize-none rounded-btn bg-transparent text-sm leading-relaxed text-ink outline-none placeholder:text-muted"
        />
      )}
    </div>
  )
}

function ImageTabBody({
  tab,
  onAdd,
  onRemove,
  onOpen,
}: {
  tab: NoteTab
  onAdd: (files: FileList | File[]) => void
  onRemove: (blobId: string) => void
  onOpen: (blobId: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const images = tab.images ?? []

  function onPaste(e: React.ClipboardEvent) {
    const files = Array.from(e.clipboardData.items)
      .filter((i) => i.type.startsWith('image/'))
      .map((i) => i.getAsFile())
      .filter((f): f is File => f !== null)
    if (files.length) onAdd(files)
  }

  return (
    <div
      onPaste={onPaste}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        if (e.dataTransfer.files.length) onAdd(e.dataTransfer.files)
      }}
      tabIndex={0}
      className={cn(
        'flex h-full flex-col gap-3 rounded-btn outline-none',
        dragOver && 'ring-2 ring-accent',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onAdd(e.target.files)
          e.target.value = ''
        }}
      />

      <button
        onClick={() => inputRef.current?.click()}
        className="flex items-center justify-center gap-2 rounded-btn border border-dashed border-line py-3 text-sm text-muted transition-colors hover:border-accent hover:text-ink"
      >
        <Upload size={15} />
        Add image — paste, drop, or pick
      </button>

      <p className="rounded-btn bg-surface-2 px-3 py-2 text-[11px] text-muted">
        Images are for your reference only — they are not read by the AI.
      </p>

      <div className="flex flex-col gap-3">
        {images.map((id) => (
          <StoredImage key={id} blobId={id} onOpen={() => onOpen(id)} onRemove={() => onRemove(id)} />
        ))}
        {images.length === 0 && (
          <p className="py-4 text-center text-xs text-muted">No images yet.</p>
        )}
      </div>
    </div>
  )
}

function StoredImage({
  blobId,
  onOpen,
  onRemove,
}: {
  blobId: string
  onOpen: () => void
  onRemove: () => void
}) {
  const url = useBlobUrl(blobId)
  return (
    <div className="group relative overflow-hidden rounded-btn border border-line">
      {url ? (
        <img
          src={url}
          alt="reference"
          onClick={onOpen}
          className="w-full cursor-zoom-in object-contain"
        />
      ) : (
        <div className="h-32 animate-pulse bg-surface-2" />
      )}
      <button
        onClick={onRemove}
        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-black/50 text-cream opacity-0 transition hover:bg-black/70 group-hover:opacity-100"
        aria-label="Delete image"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

function Lightbox({ blobId, onClose }: { blobId: string; onClose: () => void }) {
  const url = useBlobUrl(blobId)
  return (
    <div
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      ref={(el) => el?.focus()}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-8 outline-none"
    >
      {url && <img src={url} alt="reference" className="max-h-full max-w-full object-contain" />}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-cream hover:bg-black/70"
        aria-label="Close"
      >
        <X size={18} />
      </button>
    </div>
  )
}

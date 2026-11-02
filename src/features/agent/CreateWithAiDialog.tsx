import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import {
  Sparkles,
  X,
  CheckSquare,
  Square,
  FileText,
  UploadCloud,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { FILE_TYPE_META } from '@/features/files/fileMeta'
import { generateFile } from './generateFile'
import {
  AI_TYPES,
  TYPE_META,
  OPTION_FIELDS,
  defaultOptions,
  type AiType,
  type AiOptions,
} from './types'
import {
  selectableSources,
  estimatePages,
  hasGeneratableSources,
} from './sources'
import type { HoneFile } from '@/db/types'

// ─── Progress stages ────────────────────────────────────────────────────────

type Stage = 'reading' | 'writing' | 'saving'
const STAGES: { key: Stage; label: string }[] = [
  { key: 'reading', label: 'Reading sources…' },
  { key: 'writing', label: 'Generating content…' },
  { key: 'saving', label: 'Saving file…' },
]

// ─── Type card ───────────────────────────────────────────────────────────────

function TypeCard({
  aiType,
  selected,
  onSelect,
}: {
  aiType: AiType
  selected: boolean
  onSelect: () => void
}) {
  const meta = TYPE_META[aiType]
  const iconMap: Record<AiType, React.ReactNode> = {
    quiz: <span className="text-lg">📝</span>,
    flashcards: <span className="text-lg">🃏</span>,
    ai_notes: <span className="text-lg">📄</span>,
    cheatsheet: <span className="text-lg">📋</span>,
  }
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex flex-col gap-1.5 rounded-card border p-4 text-left transition-all',
        selected
          ? 'border-accent bg-accent-tint shadow-sm ring-2 ring-accent ring-offset-1'
          : 'border-line bg-surface hover:border-accent/50 hover:bg-surface-2',
      )}
    >
      {iconMap[aiType]}
      <p className="text-sm font-semibold text-ink">{meta.label}</p>
      <p className="text-xs leading-snug text-muted">{meta.description}</p>
    </button>
  )
}

// ─── Segmented option control ─────────────────────────────────────────────────

function SegmentedControl({
  label,
  choices,
  value,
  onChange,
}: {
  label: string
  choices: { value: string | number; label: string }[]
  value: string | number
  onChange: (v: string | number) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <div className="flex rounded-btn border border-line bg-surface-2 p-0.5">
        {choices.map((c) => (
          <button
            key={String(c.value)}
            type="button"
            onClick={() => onChange(c.value)}
            className={cn(
              'flex-1 rounded py-1 text-xs font-medium transition-colors',
              value === c.value
                ? 'bg-surface text-ink shadow-sm'
                : 'text-muted hover:text-ink',
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Source row ───────────────────────────────────────────────────────────────

function SourceRow({
  file,
  checked,
  onToggle,
}: {
  file: HoneFile
  checked: boolean
  onToggle: () => void
}) {
  const meta = FILE_TYPE_META[file.type]
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors',
        checked ? 'bg-accent-tint/60' : 'hover:bg-surface-2',
      )}
    >
      <span className="flex-shrink-0 text-muted">
        {checked ? <CheckSquare size={16} className="text-accent" /> : <Square size={16} />}
      </span>
      <span
        className={cn(
          'flex h-6 w-[4.5rem] flex-shrink-0 items-center justify-center rounded text-[9px] font-bold tracking-wide',
          meta.color,
        )}
      >
        {meta.label}
      </span>
      <span className="flex-1 truncate text-sm text-ink">{file.name}</span>
    </button>
  )
}

// ─── Inner content (mounts fresh each open) ──────────────────────────────────

interface InnerProps {
  folderId: number
  folderFiles: HoneFile[]
  onOpenChange: (open: boolean) => void
  onCreated?: (file: HoneFile) => void
}

function DialogInner({ folderId, folderFiles, onOpenChange, onCreated }: InnerProps) {
  const navigate = useNavigate()

  const sources = selectableSources(folderFiles)
  const hasAnySources = hasGeneratableSources(folderFiles)

  // Initial state derived directly — no effects needed
  const [aiType, setAiType] = useState<AiType>('quiz')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set(sources.map((f) => f.id!)),
  )
  const [options, setOptions] = useState<AiOptions>(() => defaultOptions('quiz'))
  const [phase, setPhase] = useState<'idle' | Stage | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [simulateError, setSimulateError] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  function handleTypeChange(t: AiType) {
    setAiType(t)
    setOptions(defaultOptions(t))
  }

  function handleOptionChange(key: string, value: string | number) {
    setOptions((prev) => ({ ...prev, [key]: value }))
  }

  function toggleSource(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedFiles = sources.filter((f) => selectedIds.has(f.id!))
  const pageCount = estimatePages(selectedFiles)
  const canGenerate = selectedIds.size > 0 && phase === 'idle'

  async function handleGenerate() {
    if (!canGenerate) return

    const abort = new AbortController()
    abortRef.current = abort

    setPhase('reading')
    const t1 = setTimeout(() => setPhase('writing'), 600)

    try {
      const file = await generateFile(
        aiType,
        [...selectedIds],
        options,
        { signal: abort.signal, simulateError },
      )
      clearTimeout(t1)
      setPhase('saving')

      await new Promise((r) => setTimeout(r, 400))
      onOpenChange(false)
      onCreated?.(file)

      toast.successWithAction(`Created '${file.name}'`, {
        label: 'Open',
        onClick: () => navigate(`/folders/${folderId}/files/${file.id}`),
      })
    } catch (err) {
      clearTimeout(t1)
      if (err instanceof DOMException && err.name === 'AbortError') {
        setPhase('idle')
      } else {
        setPhase('error')
        setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
      }
    }
  }

  function handleCancel() {
    abortRef.current?.abort()
    if (phase === 'idle' || phase === 'error') onOpenChange(false)
  }

  const isGenerating = phase === 'reading' || phase === 'writing' || phase === 'saving'
  const stageIndex = isGenerating ? STAGES.findIndex((s) => s.key === phase) : -1

  return (
    <Dialog.Content
      className="fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-full max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-card border border-line bg-surface shadow-xl outline-none"
      aria-describedby={undefined}
      onInteractOutside={(e) => isGenerating && e.preventDefault()}
      onEscapeKeyDown={(e) => isGenerating && e.preventDefault()}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-line px-6 py-4">
        <Sparkles size={18} className="text-accent" />
        <Dialog.Title className="flex-1 font-serif text-lg font-semibold text-heading">
          Create with AI
        </Dialog.Title>
        {!isGenerating && (
          <Dialog.Close asChild>
            <button
              className="rounded p-1 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </Dialog.Close>
        )}
      </div>

      {/* Generating state */}
      {isGenerating && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 py-12">
          <Loader2 size={36} className="animate-spin text-accent" />
          <div className="text-center">
            <p className="text-sm font-semibold text-ink">{STAGES[stageIndex]?.label}</p>
            <p className="mt-1 text-xs text-muted">
              {TYPE_META[aiType].label} · {selectedIds.size} source
              {selectedIds.size !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            {STAGES.map((s, i) => (
              <div
                key={s.key}
                className={cn(
                  'h-2 w-2 rounded-full transition-all',
                  i <= stageIndex ? 'bg-accent' : 'bg-line',
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="text-xs font-medium text-muted underline underline-offset-2 hover:text-ink"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Error state */}
      {phase === 'error' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-12 text-center">
          <AlertTriangle size={32} className="text-danger-text" />
          <div>
            <p className="text-sm font-semibold text-ink">Generation failed</p>
            <p className="mt-1 text-xs text-muted">{errorMsg}</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPhase('idle')}
              className="btn-primary rounded-btn px-4 py-2 text-sm"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-btn border border-line px-4 py-2 text-sm text-muted hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main form */}
      {!isGenerating && phase !== 'error' && (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {/* Type cards */}
            <section className="mb-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                File type
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {AI_TYPES.map((t) => (
                  <TypeCard
                    key={t}
                    aiType={t}
                    selected={aiType === t}
                    onSelect={() => handleTypeChange(t)}
                  />
                ))}
              </div>
            </section>

            {/* Sources */}
            <section className="mb-6">
              <div className="mb-3 flex items-baseline justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Sources
                </p>
                {selectedIds.size > 0 && (
                  <span className="text-xs text-muted">
                    about {pageCount} page{pageCount !== 1 ? 's' : ''} selected
                  </span>
                )}
              </div>

              {!hasAnySources ? (
                <div className="flex flex-col items-center gap-4 rounded-card border border-dashed border-line bg-surface-2 py-8 text-center">
                  <p className="text-sm font-medium text-ink">No sources yet</p>
                  <p className="max-w-xs text-xs text-muted">
                    Add a note or upload a file first so the AI has something to work from.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onOpenChange(false)
                        navigate(`/folders/${folderId}?new=note`)
                      }}
                      className="flex items-center gap-1.5 rounded-btn border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-2"
                    >
                      <FileText size={13} />
                      Add a note
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenChange(false)
                        navigate(`/folders/${folderId}?new=upload`)
                      }}
                      className="flex items-center gap-1.5 rounded-btn border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-2"
                    >
                      <UploadCloud size={13} />
                      Upload a file
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-0.5 rounded-card border border-line bg-surface-2 p-1">
                  {sources.map((f) => (
                    <SourceRow
                      key={f.id}
                      file={f}
                      checked={selectedIds.has(f.id!)}
                      onToggle={() => toggleSource(f.id!)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Type-specific options */}
            {hasAnySources && (
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  Options
                </p>
                <div className="flex flex-col gap-3">
                  {OPTION_FIELDS[aiType].map((field) => (
                    <SegmentedControl
                      key={field.key}
                      label={field.label}
                      choices={field.choices}
                      value={options[field.key] ?? field.choices[0].value}
                      onChange={(v) => handleOptionChange(field.key, v)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Dev-only error simulation */}
            {import.meta.env.DEV && (
              <div className="mt-5 flex items-center gap-2 rounded border border-amber-tint bg-amber-tint/40 px-3 py-2">
                <input
                  id="simulate-error"
                  type="checkbox"
                  checked={simulateError}
                  onChange={(e) => setSimulateError(e.target.checked)}
                  className="accent-amber"
                />
                <label htmlFor="simulate-error" className="text-xs text-amber">
                  DEV: Simulate generation error
                </label>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-line px-6 py-4">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-btn px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={cn(
                'btn-primary flex items-center gap-2 rounded-btn px-5 py-2 text-sm font-semibold transition-opacity',
                !canGenerate && 'cursor-not-allowed opacity-50',
              )}
            >
              <Sparkles size={14} />
              Generate
            </button>
          </div>
        </>
      )}
    </Dialog.Content>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  folderId: number
  folderFiles: HoneFile[]
  onCreated?: (file: HoneFile) => void
}

/**
 * "Create with AI" dialog. The inner content mounts fresh on each open
 * so all form state resets automatically (no reset effects needed).
 */
export function CreateWithAiDialog({ open, onOpenChange, folderId, folderFiles, onCreated }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        {open && (
          <DialogInner
            folderId={folderId}
            folderFiles={folderFiles}
            onOpenChange={onOpenChange}
            onCreated={onCreated}
          />
        )}
      </Dialog.Portal>
    </Dialog.Root>
  )
}

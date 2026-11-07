import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, Sparkles, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFile } from '@/features/files/useFiles'
import { deleteFile } from '@/features/files/fileActions'
import { QuizSchema, FlashcardsSchema } from '@/features/agent/schemas'
import { FILE_TYPE_META } from '@/features/files/fileMeta'
import type { HoneFile } from '@/db/types'

// ─── Sample badge ─────────────────────────────────────────────────────────────

function SampleBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-tint px-2.5 py-1 text-[10px] font-bold tracking-wide text-amber">
      <Sparkles size={10} />
      Sample content
    </span>
  )
}

// ─── Quiz viewer ──────────────────────────────────────────────────────────────

function QuizViewer({ content }: { content: string }) {
  let parsed: ReturnType<typeof QuizSchema.parse> | null = null
  let parseError = false
  try {
    parsed = QuizSchema.parse(JSON.parse(content))
  } catch {
    parseError = true
  }

  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [selected, setSelected] = useState<Record<number, number>>({})

  function toggle(qi: number) {
    setRevealed((prev) => {
      const next = new Set(prev)
      if (next.has(qi)) next.delete(qi)
      else next.add(qi)
      return next
    })
  }

  if (parseError || !parsed) {
    return <p className="text-sm text-danger-text">Could not parse quiz content.</p>
  }

  const { questions } = parsed

  return (
    <div className="flex flex-col gap-6">
      {questions.map((q, qi) => {
        const shown = revealed.has(qi)
        const pick = selected[qi]
        return (
          <div key={qi} className="rounded-card border border-line bg-surface p-5">
            <p className="mb-4 text-sm font-medium text-ink">
              <span className="mr-2 font-bold text-accent">{qi + 1}.</span>
              {q.question}
            </p>
            <div className="flex flex-col gap-2">
              {q.options.map((opt, oi) => {
                const isCorrect = oi === q.answerIndex
                const isPicked = pick === oi
                const showResult = shown
                return (
                  <button
                    key={oi}
                    type="button"
                    onClick={() => setSelected((prev) => ({ ...prev, [qi]: oi }))}
                    className={cn(
                      'rounded-md border px-4 py-2.5 text-left text-sm transition-colors',
                      showResult && isCorrect
                        ? 'border-success-text bg-success-tint text-success-text'
                        : showResult && isPicked && !isCorrect
                          ? 'border-danger-text bg-danger-tint text-danger-text'
                          : isPicked && !showResult
                            ? 'border-accent bg-accent-tint text-accent'
                            : 'border-line text-ink hover:border-accent/50 hover:bg-surface-2',
                    )}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => toggle(qi)}
                className="text-xs font-medium text-muted underline underline-offset-2 hover:text-ink"
              >
                {shown ? 'Hide answer' : 'Show answer'}
              </button>
              {shown && (
                <p className="max-w-sm text-right text-xs italic text-muted">{q.explanation}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Flashcards viewer ───────────────────────────────────────────────────────

function FlashcardsViewer({ content }: { content: string }) {
  let parsed: ReturnType<typeof FlashcardsSchema.parse> | null = null
  let parseError = false
  try {
    parsed = FlashcardsSchema.parse(JSON.parse(content))
  } catch {
    parseError = true
  }

  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  if (parseError || !parsed) {
    return <p className="text-sm text-danger-text">Could not parse flashcard content.</p>
  }

  const cards = parsed.cards
  const card = cards[index]
  const total = cards.length

  function next() {
    setIndex((i) => (i + 1) % total)
    setFlipped(false)
  }
  function prev() {
    setIndex((i) => (i - 1 + total) % total)
    setFlipped(false)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Card */}
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="group flex h-52 w-full max-w-lg cursor-pointer flex-col items-center justify-center gap-3 rounded-card border-2 border-line bg-surface p-8 shadow-card transition-all hover:border-accent/50"
        aria-label={flipped ? 'Click to see front' : 'Click to see back'}
      >
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
          {flipped ? 'Back' : 'Front'}
        </span>
        <p className="text-center text-base font-medium text-ink">{flipped ? card.back : card.front}</p>
        <span className="mt-2 text-xs text-muted opacity-0 transition-opacity group-hover:opacity-100">
          Click to {flipped ? 'see front' : 'flip'}
        </span>
      </button>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={prev}
          disabled={total <= 1}
          className="rounded-full border border-line p-2 text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-30"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm text-muted">
          {index + 1} / {total}
        </span>
        <button
          type="button"
          onClick={next}
          disabled={total <= 1}
          className="rounded-full border border-line p-2 text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
        <button
          type="button"
          onClick={() => {
            setIndex(0)
            setFlipped(false)
          }}
          className="ml-2 rounded-full border border-line p-2 text-muted transition-colors hover:border-accent hover:text-accent"
          aria-label="Reset"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      {/* Mini deck overview */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {cards.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              setIndex(i)
              setFlipped(false)
            }}
            className={cn(
              'h-2 w-2 rounded-full transition-all',
              i === index ? 'bg-accent scale-125' : 'bg-line hover:bg-muted',
            )}
            aria-label={`Card ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Markdown viewer ─────────────────────────────────────────────────────────

function MarkdownViewer({ content }: { content: string }) {
  return (
    <div
      className={cn(
        'prose prose-sm max-w-none',
        // Headings
        'prose-headings:font-semibold prose-headings:text-heading prose-headings:tracking-tight',
        'prose-h1:text-2xl prose-h1:font-bold prose-h2:text-lg prose-h2:border-b prose-h2:border-line prose-h2:pb-1',
        'prose-h3:text-base prose-h3:text-accent',
        // Body
        'prose-p:text-ink prose-p:leading-relaxed',
        // Lists
        'prose-ul:pl-5 prose-ol:pl-5',
        'prose-li:text-ink prose-li:marker:text-accent',
        // Strong / em
        'prose-strong:text-ink prose-strong:font-semibold',
        // Code
        'prose-code:rounded prose-code:bg-surface-2 prose-code:px-1 prose-code:py-0.5 prose-code:text-xs prose-code:font-mono prose-code:text-ink prose-code:before:content-none prose-code:after:content-none',
        'prose-pre:rounded-card prose-pre:border prose-pre:border-line prose-pre:bg-surface-2',
        // Tables
        'prose-table:text-sm prose-th:text-left prose-th:font-semibold prose-th:text-heading',
        'prose-td:align-top',
        // Horizontal rule
        'prose-hr:border-line',
        // Links
        'prose-a:text-accent prose-a:underline-offset-2',
      )}
    >
      <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{content}</ReactMarkdown>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AiFileViewer() {
  const { folderId, fileId } = useParams()
  const navigate = useNavigate()
  const file = useFile(fileId ? Number(fileId) : undefined)

  async function handleDelete() {
    if (!file) return
    if (!window.confirm(`Delete "${file.name}"? This cannot be undone.`)) return
    await deleteFile(file.id!)
    navigate(`/folders/${folderId}`)
  }

  if (!file) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted">Loading…</div>
    )
  }

  const isSample = !!(file.meta?.isSample)
  const typeMeta = FILE_TYPE_META[file.type as HoneFile['type']]

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Toolbar */}
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-line px-6 py-3">
        <button
          onClick={() => navigate(`/folders/${folderId}`)}
          className="rounded p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          aria-label="Back to folder"
        >
          <ArrowLeft size={16} />
        </button>
        <span
          className={cn(
            'flex h-6 items-center justify-center rounded px-2 text-[10px] font-bold tracking-wide',
            typeMeta.color,
          )}
        >
          {typeMeta.label}
        </span>
        <h1 className="flex-1 truncate text-sm font-semibold text-ink">{file.name}</h1>
        {isSample && <SampleBadge />}
        <button
          onClick={handleDelete}
          className="rounded p-1.5 text-muted transition-colors hover:bg-danger-tint hover:text-danger-text"
          aria-label="Delete file"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl">
          {(file.type === 'quiz') && (
            <QuizViewer content={file.content ?? ''} />
          )}
          {(file.type === 'flashcards') && (
            <FlashcardsViewer content={file.content ?? ''} />
          )}
          {(file.type === 'ai_notes' || file.type === 'cheatsheet') && (
            <MarkdownViewer content={file.content ?? ''} />
          )}
        </div>
      </div>
    </div>
  )
}

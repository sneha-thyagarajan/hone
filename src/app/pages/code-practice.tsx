import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, Play, Loader2, Save, Trash2, Terminal } from 'lucide-react'
import { useFile } from '@/features/files/useFiles'
import { useAutosave } from '@/features/notes/useAutosave'
import { useCodeEditor } from '@/features/code/useCodeEditor'
import { useSnapshots, saveSnapshot, deleteSnapshot } from '@/features/code/attempts'
import { NotesPanel } from '@/features/code/NotesPanel'
import { makeProblemTab, PROBLEM_TAB_ID, type NoteTab } from '@/features/code/noteTabs'
import { runCode } from '@/runner/runnerClient'
import { isRunnable, type Language, type RunResult } from '@/runner/types'
import { toast } from '@/lib/toast'
import { db } from '@/db'
import { renameFile } from '@/features/files/fileActions'
import type { Attempt, HoneFile } from '@/db/types'

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
      className="rounded-md px-1.5 py-0.5 font-serif text-xl font-semibold text-heading transition-colors hover:bg-surface-2"
      title="Click to rename"
    >
      {name}
    </button>
  )
}

function CodePracticeBody({ file, folderId }: { file: HoneFile; folderId?: string }) {
  const navigate = useNavigate()
  const { save } = useAutosave(file.id)
  const snapshots = useSnapshots(file.id)

  const initialLanguage = ((file.meta?.language as Language) ?? 'python') as Language
  const initialContent = file.content ?? ''

  const [language, setLanguage] = useState<Language>(initialLanguage)
  const [content, setContent] = useState(initialContent)
  const [seed, setSeed] = useState(0)
  const [result, setResult] = useState<RunResult | null>(null)
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('')

  // Notes tabs: migrate the legacy single "question" field into a Problem tab.
  const [notesTabs, setNotesTabs] = useState<NoteTab[]>(() =>
    Array.isArray(file.meta?.noteTabs)
      ? (file.meta!.noteTabs as NoteTab[])
      : [makeProblemTab((file.meta?.question as string) ?? '')],
  )
  const [notesActive, setNotesActive] = useState<string>(
    (file.meta?.activeTab as string) ?? PROBLEM_TAB_ID,
  )

  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function updateMeta(partial: Record<string, unknown>) {
    db.files.update(file.id!, { meta: { ...(file.meta ?? {}), ...partial } })
  }

  function onNotesChange(tabs: NoteTab[], activeId: string) {
    setNotesTabs(tabs)
    setNotesActive(activeId)
    if (notesTimer.current) clearTimeout(notesTimer.current)
    notesTimer.current = setTimeout(() => updateMeta({ noteTabs: tabs, activeTab: activeId }), 500)
  }

  const editorRef = useCodeEditor({
    value: content,
    language,
    resetKey: seed,
    onChange: (v) => {
      setContent(v)
      save(v)
    },
  })

  function changeLanguage(next: Language) {
    setLanguage(next)
    updateMeta({ language: next })
    setResult(null)
  }

  async function run() {
    if (!isRunnable(language)) return
    setRunning(true)
    setResult(null)
    setStatus('')
    const outcome = await runCode(language, content, { onStatus: setStatus })
    setRunning(false)
    setResult(outcome)
  }

  async function snapshot() {
    await saveSnapshot({
      fileId: file.id!,
      language,
      code: content,
      noteTabs: notesTabs,
      activeTab: notesActive,
    })
    toast.success('Snapshot saved')
  }

  function restore(a: Attempt) {
    const detail = a.detail as
      | { code?: string; language?: Language; noteTabs?: NoteTab[]; activeTab?: string }
      | undefined
    if (!detail?.code) return
    if (detail.language && detail.language !== language) {
      setLanguage(detail.language)
      updateMeta({ language: detail.language })
    }
    setContent(detail.code)
    save(detail.code)
    setSeed((s) => s + 1)
    // Restore the notes captured with the snapshot, too.
    if (Array.isArray(detail.noteTabs) && detail.noteTabs.length) {
      const tabs = detail.noteTabs
      const activeId = tabs.some((t) => t.id === detail.activeTab)
        ? detail.activeTab!
        : tabs[0].id
      onNotesChange(tabs, activeId)
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex min-h-[60px] flex-wrap items-center gap-3 border-b border-line bg-surface/70 px-5 backdrop-blur">
        <button
          onClick={() => navigate(`/folders/${folderId}`)}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-btn text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          aria-label="Back to folder"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex flex-1 items-center gap-2">
          <InlineRename name={file.name} fileId={file.id!} />
        </div>

        <select
          value={language}
          onChange={(e) => changeLanguage(e.target.value as Language)}
          className="rounded-btn border border-line bg-surface px-2.5 py-1.5 text-sm text-ink outline-none focus:border-accent"
        >
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="java">Java</option>
        </select>

        <button
          onClick={run}
          disabled={running || !isRunnable(language)}
          title={isRunnable(language) ? undefined : 'Java is edit-only — run Python or JavaScript'}
          className="btn-primary flex min-h-[36px] items-center gap-1.5 rounded-btn px-4 text-sm font-semibold"
        >
          {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          Run
        </button>

        <button
          onClick={snapshot}
          className="flex min-h-[36px] items-center gap-1.5 rounded-btn border border-line bg-surface px-3 text-sm font-medium text-ink shadow-xs transition-colors hover:bg-surface-2"
        >
          <Save size={14} />
          Save
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 gap-4 overflow-auto p-5">
        <NotesPanel tabs={notesTabs} activeId={notesActive} onChange={onNotesChange} />

        {/* Editor + output */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div
            ref={editorRef}
            className="h-[400px] overflow-hidden rounded-card border border-line"
          />

          <div className="rounded-card border border-line bg-surface p-4 shadow-card">
            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
              <Terminal size={12} />
              Output
            </p>
            {running ? (
              <p className="flex items-center gap-2 text-sm text-muted">
                <Loader2 size={14} className="animate-spin" />
                {status || 'Running…'}
              </p>
            ) : result?.timedOut ? (
              <p className="text-sm text-danger-text">
                Timed out — your code took too long (possible infinite loop).
              </p>
            ) : result ? (
              <>
                {result.output && (
                  <pre className="whitespace-pre-wrap font-mono text-[13px] text-ink">
                    {result.output}
                  </pre>
                )}
                {result.error && (
                  <pre className="mt-2 whitespace-pre-wrap font-mono text-[13px] text-danger-text">
                    {result.error}
                  </pre>
                )}
                {!result.output && !result.error && (
                  <p className="text-sm text-muted">Ran with no output.</p>
                )}
              </>
            ) : !isRunnable(language) ? (
              <p className="text-sm text-muted">
                Java is edit-only for now — switch to Python or JavaScript to run.
              </p>
            ) : (
              <p className="text-sm text-muted">Press Run to execute your code.</p>
            )}
          </div>
        </div>

        {/* Snapshots */}
        <div className="w-56 flex-shrink-0 self-start rounded-card border border-line bg-surface p-4 shadow-card">
          <h2 className="mb-2 text-sm font-semibold text-ink">Snapshots</h2>
          {snapshots.length === 0 ? (
            <p className="text-xs text-muted">No snapshots yet. Press Save to keep a version.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {snapshots.map((a) => {
                const d = a.detail as { language?: Language }
                return (
                  <div
                    key={a.id}
                    className="group flex items-center gap-2 rounded-btn border border-line p-2.5"
                  >
                    <button onClick={() => restore(a)} className="flex flex-1 flex-col text-left">
                      <span className="text-xs font-semibold text-ink">
                        {format(a.at, 'd MMM, HH:mm')}
                      </span>
                      <span className="text-[11px] text-muted">{d.language}</span>
                    </button>
                    <button
                      onClick={() => deleteSnapshot(a.id!)}
                      className="rounded p-0.5 text-muted opacity-0 transition hover:bg-surface-2 hover:text-ink group-hover:opacity-100"
                      aria-label="Delete snapshot"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )
              })}
              <p className="mt-1 text-[11px] text-muted">Open a snapshot to restore its code.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CodePracticePage() {
  const { folderId, fileId } = useParams()
  const file = useFile(fileId ? Number(fileId) : undefined)

  if (!file) {
    return <div className="flex flex-1 items-center justify-center text-muted">File not found.</div>
  }
  if (file.type !== 'code') {
    return (
      <div className="flex flex-1 items-center justify-center text-muted">
        This file type has no code editor.
      </div>
    )
  }

  return <CodePracticeBody key={file.id} file={file} folderId={folderId} />
}

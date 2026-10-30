import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as RadioGroup from '@radix-ui/react-radio-group'
import { cn } from '@/lib/utils'
import type { FolderKind } from '@/db/types'
import { createFolder } from './folderActions'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const KINDS: { value: FolderKind; label: string; description: string }[] = [
  {
    value: 'theory',
    label: 'Theory subject',
    description: 'Notes, PDFs and slides. Quizzes and flashcards.',
  },
  {
    value: 'coding',
    label: 'Coding subject',
    description: 'Adds a code editor and practice problems.',
  },
  {
    value: 'mixed',
    label: 'Mixed',
    description: 'Everything above in one folder.',
  },
]

export function CreateFolderDialog({ open, onOpenChange }: Props) {
  const [name, setName] = useState('')
  const [kind, setKind] = useState<FolderKind>('theory')
  const [examDate, setExamDate] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function reset() {
    setName('')
    setKind('theory')
    setExamDate('')
    setError('')
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter a folder name.')
      return
    }
    setLoading(true)
    try {
      await createFolder({ name, kind, examDate: examDate || undefined })
      reset()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="dialog-content fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-card bg-surface p-8 shadow-lg focus:outline-none">
          <Dialog.Title className="font-serif text-2xl font-semibold text-heading">
            Create folder
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
            {/* Folder name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="folder-name" className="text-sm font-medium text-ink">
                Folder name
              </label>
              <input
                id="folder-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError('')
                }}
                placeholder="e.g. Data Structures"
                className={cn(
                  'rounded-btn border px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20',
                  error ? 'border-danger-text' : 'border-line',
                )}
                autoFocus
              />
              {error && <p className="text-xs text-danger-text">{error}</p>}
            </div>

            {/* Subject kind */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-ink">What kind of subject is it?</p>
              <RadioGroup.Root
                value={kind}
                onValueChange={(v) => setKind(v as FolderKind)}
                className="flex flex-col gap-2"
              >
                {KINDS.map((k) => (
                  <label
                    key={k.value}
                    htmlFor={`kind-${k.value}`}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-btn border p-3.5 transition-colors',
                      kind === k.value
                        ? 'border-accent bg-accent-tint'
                        : 'border-line hover:border-accent/50',
                    )}
                  >
                    <RadioGroup.Item
                      id={`kind-${k.value}`}
                      value={k.value}
                      className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border border-muted data-[state=checked]:border-accent"
                    >
                      <RadioGroup.Indicator className="flex h-full items-center justify-center after:block after:h-2 after:w-2 after:rounded-full after:bg-accent" />
                    </RadioGroup.Item>
                    <div>
                      <p className="text-sm font-semibold text-ink">{k.label}</p>
                      <p className="text-xs text-muted">{k.description}</p>
                    </div>
                  </label>
                ))}
              </RadioGroup.Root>
            </div>

            {/* Exam date */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="exam-date" className="text-sm font-medium text-ink">
                Exam date{' '}
                <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id="exam-date"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="rounded-btn border border-line px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
              <p className="text-xs text-muted">Shows up in your planner and countdowns.</p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-1">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-btn px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary rounded-btn px-5 py-2.5 text-sm font-semibold"
              >
                {loading ? 'Creating…' : 'Create folder'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

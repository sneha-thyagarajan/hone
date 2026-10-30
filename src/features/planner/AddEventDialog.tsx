import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'
import { useFolders } from '@/features/folders/useFolders'
import { createEvent } from './eventActions'
import { toast } from '@/lib/toast'
import type { CalEventKind } from '@/db/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultDate: string
}

const KINDS: { value: CalEventKind; label: string }[] = [
  { value: 'exam', label: 'Exam' },
  { value: 'study', label: 'Study' },
  { value: 'deadline', label: 'Deadline' },
]

export function AddEventDialog({ open, onOpenChange, defaultDate }: Props) {
  const folders = useFolders()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [kind, setKind] = useState<CalEventKind>('study')
  const [folderId, setFolderId] = useState<string>('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Please enter a title.')
      return
    }
    setLoading(true)
    try {
      await createEvent({
        title,
        date,
        kind,
        folderId: folderId ? Number(folderId) : undefined,
      })
      toast.success('Event added')
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const fieldClass =
    'rounded-btn border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20'

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="dialog-content fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-card bg-surface p-8 shadow-lg focus:outline-none">
          <Dialog.Title className="font-serif text-2xl font-semibold text-heading">
            Add event
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="event-title" className="text-sm font-medium text-ink">
                Title
              </label>
              <input
                id="event-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  setError('')
                }}
                placeholder="e.g. Heaps review"
                className={cn(fieldClass, error && 'border-danger-text')}
                autoFocus
              />
              {error && <p className="text-xs text-danger-text">{error}</p>}
            </div>

            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-1.5">
                <label htmlFor="event-date" className="text-sm font-medium text-ink">
                  Date
                </label>
                <input
                  id="event-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <label htmlFor="event-kind" className="text-sm font-medium text-ink">
                  Kind
                </label>
                <select
                  id="event-kind"
                  value={kind}
                  onChange={(e) => setKind(e.target.value as CalEventKind)}
                  className={fieldClass}
                >
                  {KINDS.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="event-folder" className="text-sm font-medium text-ink">
                Folder <span className="font-normal text-muted">(optional)</span>
              </label>
              <select
                id="event-folder"
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className={fieldClass}
              >
                <option value="">No folder</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-1 flex justify-end gap-3">
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
                {loading ? 'Adding…' : 'Add event'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

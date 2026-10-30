import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import type { Folder } from '@/db/types'
import { updateFolderExamDate } from './folderActions'
import { toast } from '@/lib/toast'

interface Props {
  folder: Folder
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditExamDateDialog({ folder, open, onOpenChange }: Props) {
  const [date, setDate] = useState(folder.examDate ?? '')
  const [loading, setLoading] = useState(false)

  async function save(value: string | undefined) {
    setLoading(true)
    try {
      await updateFolderExamDate(folder.id!, value)
      toast.success(value ? 'Exam date updated' : 'Exam date cleared')
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="dialog-content fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-card bg-surface p-8 shadow-lg focus:outline-none">
          <Dialog.Title className="font-serif text-2xl font-semibold text-heading">
            Exam date
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted">
            Shows up in your planner and countdowns.
          </Dialog.Description>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              save(date || undefined)
            }}
            className="mt-6 flex flex-col gap-5"
          >
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-btn border border-line bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
              autoFocus
            />

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => save(undefined)}
                disabled={loading || !folder.examDate}
                className="rounded-btn px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 disabled:opacity-40"
              >
                Clear date
              </button>
              <div className="flex gap-3">
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
                  {loading ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

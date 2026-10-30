import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'
import type { Folder } from '@/db/types'
import { renameFolder } from './folderActions'

interface Props {
  folder: Folder
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RenameFolderDialog({ folder, open, onOpenChange }: Props) {
  const [name, setName] = useState(folder.name)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter a folder name.')
      return
    }
    setLoading(true)
    try {
      await renameFolder(folder.id!, name)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
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
            Rename folder
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rename-folder" className="text-sm font-medium text-ink">
                Folder name
              </label>
              <input
                id="rename-folder"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError('')
                }}
                className={cn(
                  'rounded-btn border px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20',
                  error ? 'border-danger-text' : 'border-line',
                )}
                autoFocus
              />
              {error && <p className="text-xs text-danger-text">{error}</p>}
            </div>

            <div className="flex justify-end gap-3">
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
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

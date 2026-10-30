import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import type { Folder } from '@/db/types'
import { deleteFolder } from './folderActions'

interface Props {
  folder: Folder
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteFolderAlert({ folder, open, onOpenChange }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      await deleteFolder(folder.id!)
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
            Delete &ldquo;{folder.name}&rdquo;?
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted">
            This will permanently delete the folder and all its files. This cannot be undone.
          </Dialog.Description>

          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-btn px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2"
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="rounded-btn bg-danger-text px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:opacity-90 disabled:opacity-60"
            >
              {loading ? 'Deleting…' : 'Delete folder'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

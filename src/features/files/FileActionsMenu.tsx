import { useRef, useState } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'
import { renameFile, deleteFile } from './fileActions'
import type { HoneFile } from '@/db/types'

interface Props {
  file: HoneFile
  onDeleted?: () => void
}

export function FileActionsMenu({ file, onDeleted }: Props) {
  const [dropOpen, setDropOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [renameValue, setRenameValue] = useState(file.name)
  const [renaming, setRenaming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function openRename() {
    setRenameValue(file.name)
    setRenameOpen(true)
    setDropOpen(false)
  }

  function openDelete() {
    setDeleteOpen(true)
    setDropOpen(false)
  }

  async function handleRename() {
    const trimmed = renameValue.trim()
    if (!trimmed || trimmed === file.name) {
      setRenameOpen(false)
      return
    }
    setRenaming(true)
    try {
      await renameFile(file.id!, trimmed)
      setRenameOpen(false)
    } finally {
      setRenaming(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteFile(file.id!)
      setDeleteOpen(false)
      onDeleted?.()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {/* ── Dropdown ── */}
      <DropdownMenu.Root open={dropOpen} onOpenChange={setDropOpen}>
        <DropdownMenu.Trigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'rounded p-1 text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:bg-surface-2 hover:text-ink',
              dropOpen && 'opacity-100',
            )}
            aria-label="File actions"
          >
            <MoreHorizontal size={15} />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={4}
            onClick={(e) => e.stopPropagation()}
            className="z-50 min-w-[160px] rounded-card border border-line bg-surface py-1 shadow-card"
          >
            <DropdownMenu.Item
              onSelect={openRename}
              className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm text-ink outline-none hover:bg-surface-2"
            >
              <Pencil size={14} className="text-muted" />
              Rename
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="my-1 h-px bg-line" />
            <DropdownMenu.Item
              onSelect={openDelete}
              className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm text-danger-text outline-none hover:bg-danger-tint"
            >
              <Trash2 size={14} />
              Delete
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* ── Rename dialog ── */}
      <Dialog.Root open={renameOpen} onOpenChange={setRenameOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-card border border-line bg-surface p-6 shadow-xl"
            aria-describedby={undefined}
            onOpenAutoFocus={(e) => {
              e.preventDefault()
              inputRef.current?.focus()
              inputRef.current?.select()
            }}
          >
            <Dialog.Title className="mb-4 font-serif text-lg font-semibold text-heading">
              Rename file
            </Dialog.Title>
            <input
              ref={inputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') setRenameOpen(false)
              }}
              className="w-full rounded-btn border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="File name"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRenameOpen(false)}
                className="rounded-btn px-4 py-2 text-sm font-medium text-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRename}
                disabled={renaming || !renameValue.trim()}
                className="btn-primary rounded-btn px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {renaming ? 'Saving…' : 'Save'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ── Delete confirm dialog ── */}
      <Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-card border border-line bg-surface p-6 shadow-xl"
            aria-describedby="delete-file-desc"
          >
            <Dialog.Title className="mb-2 font-serif text-lg font-semibold text-heading">
              Delete file?
            </Dialog.Title>
            <p id="delete-file-desc" className="mb-5 text-sm text-muted">
              <strong className="font-medium text-ink">{file.name}</strong> will be permanently
              deleted. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="rounded-btn px-4 py-2 text-sm font-medium text-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 rounded-btn bg-danger-text px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Trash2 size={14} />
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}

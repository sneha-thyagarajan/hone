import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as RadioGroup from '@radix-ui/react-radio-group'
import { cn } from '@/lib/utils'
import type { Folder, FolderKind } from '@/db/types'
import { updateFolderKind } from './folderActions'
import { toast } from '@/lib/toast'

interface Props {
  folder: Folder
  open: boolean
  onOpenChange: (open: boolean) => void
}

const KINDS: { value: FolderKind; label: string; description: string }[] = [
  { value: 'theory', label: 'Theory subject', description: 'Notes, PDFs and slides. Quizzes and flashcards.' },
  { value: 'coding', label: 'Coding subject', description: 'Adds a code editor and practice problems.' },
  { value: 'mixed', label: 'Mixed', description: 'Everything above in one folder.' },
]

export function ChangeFolderTypeDialog({ folder, open, onOpenChange }: Props) {
  const [kind, setKind] = useState<FolderKind>(folder.kind)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setLoading(true)
    try {
      await updateFolderKind(folder.id!, kind)
      toast.success('Folder type changed')
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="dialog-content fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-card bg-surface p-8 shadow-lg focus:outline-none">
          <Dialog.Title className="font-serif text-2xl font-semibold text-heading">
            Change folder type
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted">
            Your existing files are kept — hidden tools just stop appearing in menus.
          </Dialog.Description>

          <RadioGroup.Root
            value={kind}
            onValueChange={(v) => setKind(v as FolderKind)}
            className="mt-5 flex flex-col gap-2"
          >
            {KINDS.map((k) => (
              <label
                key={k.value}
                htmlFor={`change-kind-${k.value}`}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-btn border p-3.5 transition-colors',
                  kind === k.value ? 'border-accent bg-accent-tint' : 'border-line hover:border-accent/50',
                )}
              >
                <RadioGroup.Item
                  id={`change-kind-${k.value}`}
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
              onClick={handleSave}
              disabled={loading}
              className="btn-primary rounded-btn px-5 py-2.5 text-sm font-semibold"
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

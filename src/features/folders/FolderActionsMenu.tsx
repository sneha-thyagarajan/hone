import { useState } from 'react'
import { MoreHorizontal, Pencil, CalendarClock, Trash2 } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'
import type { Folder } from '@/db/types'
import { RenameFolderDialog } from './RenameFolderDialog'
import { EditExamDateDialog } from './EditExamDateDialog'
import { DeleteFolderAlert } from './DeleteFolderAlert'

type Variant = 'sidebar' | 'page'

interface Props {
  folder: Folder
  variant?: Variant
}

/** A self-contained "..." menu with Rename / Edit exam date / Delete and their dialogs. */
export function FolderActionsMenu({ folder, variant = 'page' }: Props) {
  const [dialog, setDialog] = useState<null | 'rename' | 'exam' | 'delete'>(null)

  const trigger =
    variant === 'sidebar'
      ? 'hidden rounded p-0.5 text-sidebar-muted hover:text-cream group-hover:flex data-[state=open]:flex'
      : 'flex h-9 w-9 items-center justify-center rounded-btn border border-line bg-surface text-muted shadow-xs transition-colors hover:text-ink'

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className={cn(trigger)}
            aria-label="Folder options"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal size={variant === 'sidebar' ? 13 : 16} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={4}
            className="z-50 min-w-[170px] rounded-card border border-line bg-surface py-1 shadow-lg"
          >
            <DropdownMenu.Item
              onSelect={() => setDialog('rename')}
              className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-ink outline-none hover:bg-surface-2"
            >
              <Pencil size={14} className="text-muted" />
              Rename
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => setDialog('exam')}
              className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-ink outline-none hover:bg-surface-2"
            >
              <CalendarClock size={14} className="text-muted" />
              Edit exam date
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="my-1 h-px bg-line" />
            <DropdownMenu.Item
              onSelect={() => setDialog('delete')}
              className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-danger-text outline-none hover:bg-danger-tint"
            >
              <Trash2 size={14} />
              Delete
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <RenameFolderDialog
        folder={folder}
        open={dialog === 'rename'}
        onOpenChange={(v) => !v && setDialog(null)}
      />
      <EditExamDateDialog
        folder={folder}
        open={dialog === 'exam'}
        onOpenChange={(v) => !v && setDialog(null)}
      />
      <DeleteFolderAlert
        folder={folder}
        open={dialog === 'delete'}
        onOpenChange={(v) => !v && setDialog(null)}
      />
    </>
  )
}

import { useState } from 'react'
import { NavLink, useParams } from 'react-router-dom'
import { ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFolders } from '@/features/folders/useFolders'
import type { Folder } from '@/db/types'

interface FolderRowProps {
  folder: Folder
  onRename: (folder: Folder) => void
  onDelete: (folder: Folder) => void
}

function FolderRow({ folder, onRename, onDelete }: FolderRowProps) {
  const [open, setOpen] = useState(false)
  const { folderId } = useParams()
  const isActive = folderId === String(folder.id)

  return (
    <div>
      <div
        className={cn(
          'group flex min-h-[36px] cursor-pointer items-center gap-1 rounded-btn px-2 py-1 text-sm transition-colors',
          isActive ? 'bg-accent-tint font-semibold text-accent' : 'text-ink hover:bg-line',
        )}
      >
        <button
          className="flex-shrink-0 rounded p-0.5 hover:bg-line"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Collapse folder' : 'Expand folder'}
        >
          <ChevronRight
            size={14}
            className={cn('transition-transform', open && 'rotate-90')}
          />
        </button>

        <NavLink
          to={`/folders/${folder.id}`}
          className="flex-1 truncate"
          onClick={() => setOpen(true)}
        >
          {folder.name}
        </NavLink>

        <button
          className="hidden rounded p-0.5 hover:bg-line group-hover:flex"
          onClick={(e) => {
            e.stopPropagation()
            // Context menu placeholder: rename/delete via inline actions
            const action = window.confirm(
              `Rename "${folder.name}"?\n\nClick OK to rename, Cancel to delete.`,
            )
            if (action) onRename(folder)
            else onDelete(folder)
          }}
          aria-label="Folder options"
        >
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* File list placeholder – filled in when file feature is built */}
      {open && isActive && (
        <div className="ml-5 border-l border-line pl-2 text-xs text-muted">
          {/* files will render here */}
        </div>
      )}
    </div>
  )
}

interface FolderTreeProps {
  onRename: (folder: Folder) => void
  onDelete: (folder: Folder) => void
}

export function FolderTree({ onRename, onDelete }: FolderTreeProps) {
  const folders = useFolders()

  if (folders.length === 0) {
    return <p className="px-3 text-xs text-muted">No folders yet.</p>
  }

  return (
    <div className="flex flex-col gap-0.5">
      {folders.map((folder) => (
        <FolderRow
          key={folder.id}
          folder={folder}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

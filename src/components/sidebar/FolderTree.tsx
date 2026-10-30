import { useState } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, FileText, Code, File } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFolders } from '@/features/folders/useFolders'
import { useFiles } from '@/features/files/useFiles'
import type { Folder, HoneFile } from '@/db/types'

function fileIcon(type: HoneFile['type']) {
  if (type === 'code') return <Code size={12} className="flex-shrink-0 text-muted" />
  if (type === 'note' || type === 'notes_ai') return <FileText size={12} className="flex-shrink-0 text-muted" />
  return <File size={12} className="flex-shrink-0 text-muted" />
}

interface FileItemProps {
  file: HoneFile
  folderId: number
}

function FileItem({ file, folderId }: FileItemProps) {
  return (
    <NavLink
      to={`/folders/${folderId}/files/${file.id}`}
      className={({ isActive }) =>
        cn(
          'flex min-h-[32px] items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors',
          isActive ? 'bg-accent-tint font-semibold text-accent' : 'text-muted hover:bg-line hover:text-ink',
        )
      }
    >
      {fileIcon(file.type)}
      <span className="truncate">{file.name}</span>
    </NavLink>
  )
}

interface FolderRowProps {
  folder: Folder
  onRename: (folder: Folder) => void
  onDelete: (folder: Folder) => void
}

function FolderRow({ folder, onRename, onDelete }: FolderRowProps) {
  const { folderId: activeFolderId } = useParams()
  const isActive = activeFolderId === String(folder.id)
  const [open, setOpen] = useState(isActive)
  const files = useFiles(open ? folder.id : undefined)
  const navigate = useNavigate()

  function handleToggle() {
    const next = !open
    setOpen(next)
    if (next) navigate(`/folders/${folder.id}`)
  }

  return (
    <div>
      <div
        className={cn(
          'group flex min-h-[36px] items-center gap-1 rounded-btn px-1 py-1 text-sm transition-colors',
          isActive ? 'bg-accent-tint text-accent' : 'text-ink hover:bg-line',
        )}
      >
        <button
          onClick={handleToggle}
          className="flex flex-shrink-0 items-center gap-1 rounded p-0.5"
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          <ChevronRight
            size={13}
            className={cn('transition-transform', open && 'rotate-90')}
          />
        </button>

        <NavLink
          to={`/folders/${folder.id}`}
          onClick={() => setOpen(true)}
          className="flex-1 truncate text-sm"
        >
          {folder.name}
        </NavLink>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="hidden rounded p-0.5 hover:bg-line group-hover:flex"
              aria-label="Folder options"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal size={13} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="start"
              sideOffset={4}
              className="z-50 min-w-[140px] rounded-card border border-line bg-white py-1 shadow-card"
            >
              <DropdownMenu.Item
                onSelect={() => onRename(folder)}
                className="cursor-pointer px-3 py-2 text-sm text-ink outline-none hover:bg-bg"
              >
                Rename
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={() => onDelete(folder)}
                className="cursor-pointer px-3 py-2 text-sm text-danger-text outline-none hover:bg-danger-tint"
              >
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {open && (
        <div className="ml-3 flex flex-col gap-0.5 border-l border-line pl-2">
          {files.map((f) => (
            <FileItem key={f.id} file={f} folderId={folder.id!} />
          ))}
          {files.length === 0 && (
            <p className="py-1 text-[11px] text-muted">No files yet</p>
          )}
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
        <FolderRow key={folder.id} folder={folder} onRename={onRename} onDelete={onDelete} />
      ))}
    </div>
  )
}

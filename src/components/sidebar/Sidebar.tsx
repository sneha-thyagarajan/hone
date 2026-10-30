import { useState } from 'react'
import { BookOpen, Plus } from 'lucide-react'
import { NavItem } from './NavItem'
import { FolderTree } from './FolderTree'
import { CreateFolderDialog } from '@/features/folders/CreateFolderDialog'
import { RenameFolderDialog } from '@/features/folders/RenameFolderDialog'
import { DeleteFolderAlert } from '@/features/folders/DeleteFolderAlert'
import type { Folder } from '@/db/types'

export function Sidebar() {
  const [createOpen, setCreateOpen] = useState(false)
  const [folderToRename, setFolderToRename] = useState<Folder | null>(null)
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null)

  return (
    <>
      <aside className="flex h-screen w-56 flex-shrink-0 flex-col border-r border-line bg-white">
        {/* App name */}
        <div className="flex h-14 items-center gap-2 border-b border-line px-4">
          <BookOpen size={18} className="text-accent" />
          <span className="font-serif text-base font-semibold text-ink">Hone</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-2 pt-3">
          <NavItem to="/">Home</NavItem>
          <NavItem to="/planner">Planner</NavItem>
        </nav>

        {/* Folders */}
        <div className="mt-4 flex flex-col gap-1 px-2">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-widest text-muted">
            Folders
          </p>
          <FolderTree
            onRename={(f) => setFolderToRename(f)}
            onDelete={(f) => setFolderToDelete(f)}
          />
        </div>

        {/* New folder button */}
        <div className="mt-auto border-t border-line p-3">
          <button
            onClick={() => setCreateOpen(true)}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-btn border border-line bg-white text-sm font-medium text-ink transition-colors hover:bg-bg"
          >
            <Plus size={16} />
            New folder
          </button>
        </div>
      </aside>

      <CreateFolderDialog open={createOpen} onOpenChange={setCreateOpen} />

      {folderToRename && (
        <RenameFolderDialog
          folder={folderToRename}
          open={!!folderToRename}
          onOpenChange={(v) => !v && setFolderToRename(null)}
        />
      )}

      {folderToDelete && (
        <DeleteFolderAlert
          folder={folderToDelete}
          open={!!folderToDelete}
          onOpenChange={(v) => !v && setFolderToDelete(null)}
        />
      )}
    </>
  )
}

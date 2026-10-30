import { useState } from 'react'
import { Home, CalendarDays, Plus, GraduationCap } from 'lucide-react'
import { NavItem } from './NavItem'
import { FolderTree } from './FolderTree'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
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
      <aside className="sidebar-surface flex h-screen w-60 flex-shrink-0 flex-col border-r border-white/5">
        {/* Brand */}
        <div className="flex h-16 items-center gap-2.5 px-5">
          <div className="logo-mark flex h-9 w-9 items-center justify-center rounded-xl shadow-glow">
            <GraduationCap size={19} className="text-cream" />
          </div>
          <span className="font-serif text-lg font-semibold tracking-tight text-cream">Hone</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-3 pt-2">
          <NavItem to="/" icon={<Home size={17} />}>
            Home
          </NavItem>
          <NavItem to="/planner" icon={<CalendarDays size={17} />}>
            Planner
          </NavItem>
        </nav>

        {/* Folders */}
        <div className="mt-6 flex min-h-0 flex-1 flex-col px-3">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted">
            Folders
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <FolderTree
              onRename={(f) => setFolderToRename(f)}
              onDelete={(f) => setFolderToDelete(f)}
            />
          </div>
        </div>

        {/* New folder */}
        <div className="p-3">
          <button
            onClick={() => setCreateOpen(true)}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-btn border border-white/10 bg-white/5 text-sm font-medium text-sidebar-text transition-colors hover:bg-white/10 hover:text-cream"
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

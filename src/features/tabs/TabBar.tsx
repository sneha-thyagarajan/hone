import { useEffect, useMemo, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useLocation, useNavigate } from 'react-router-dom'
import { FileText, File, Code2, Layers, X } from 'lucide-react'
import { db } from '@/db'
import { cn } from '@/lib/utils'
import { pruneTabs, useTabsStore } from './tabsStore'
import type { HoneFile } from '@/db/types'

function fileIcon(type: HoneFile['type']) {
  if (type === 'code') return <Code2 size={13} className="flex-shrink-0" />
  if (type === 'flashcards') return <Layers size={13} className="flex-shrink-0" />
  if (type === 'upload') return <File size={13} className="flex-shrink-0" />
  return <FileText size={13} className="flex-shrink-0" />
}

export function TabBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const dragFrom = useRef<number | null>(null)

  const openIds = useTabsStore((s) => s.openIds)
  const activeId = useTabsStore((s) => s.activeId)
  const hydrated = useTabsStore((s) => s.hydrated)
  const { hydrate, open, setActive, close, move, prune } = useTabsStore.getState()

  // The file id currently shown by the route (layout has no route param itself).
  const routeFileId = useMemo(() => {
    const m = location.pathname.match(/\/files\/(\d+)/)
    return m ? Number(m[1]) : null
  }, [location.pathname])

  // Tagged with the ids it queried, so we can tell a fresh result from a stale
  // one (useLiveQuery holds the previous value for a tick after openIds change).
  const query = useLiveQuery(
    async () => {
      const ids = openIds
      const files = ids.length ? await db.files.where('id').anyOf(ids).toArray() : []
      return { key: ids.join(','), files }
    },
    [openIds.join(',')],
  )

  const fresh = query?.key === openIds.join(',')

  const fileMap = useMemo(() => {
    const m = new Map<number, HoneFile>()
    for (const f of query?.files ?? []) if (f.id != null) m.set(f.id, f)
    return m
  }, [query])

  const routeOf = (f: HoneFile) => `/folders/${f.folderId}/files/${f.id}`

  // Restore persisted tabs once on mount.
  useEffect(() => {
    if (!hydrated) void hydrate()
  }, [hydrated, hydrate])

  // Keep the active tab in sync with the route; opening a file focuses/opens it.
  useEffect(() => {
    if (!hydrated) return
    if (routeFileId !== null) open(routeFileId)
    else setActive(null)
  }, [hydrated, routeFileId, open, setActive])

  // Quietly close tabs whose file was deleted; navigate away if it was showing.
  // Only act on a fresh query so a newly opened tab isn't mistaken for deleted.
  useEffect(() => {
    if (!query || !fresh) return
    const existing = query.files.map((f) => f.id!).filter((id) => id != null)
    if (existing.length === openIds.length) return
    const snap = pruneTabs({ openIds, activeId }, existing)
    prune(existing)
    if (routeFileId !== null && !existing.includes(routeFileId)) {
      const next = snap.activeId != null ? fileMap.get(snap.activeId) : undefined
      navigate(next ? routeOf(next) : '/')
    }
  }, [query, fresh, openIds, activeId, routeFileId, prune, navigate, fileMap])

  function goToFile(id: number) {
    const f = fileMap.get(id)
    if (f) navigate(routeOf(f))
  }

  function closeAndMaybeNavigate(id: number) {
    const nextId = close(id)
    if (routeFileId === id) {
      const next = nextId != null ? fileMap.get(nextId) : undefined
      navigate(next ? routeOf(next) : '/')
    }
  }

  // Keyboard: Cmd/Ctrl+W close current, Cmd/Ctrl+1..9 switch.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return
      if (e.key.toLowerCase() === 'w') {
        if (activeId != null) {
          e.preventDefault()
          closeAndMaybeNavigate(activeId)
        }
      } else if (/^[1-9]$/.test(e.key)) {
        const id = openIds[Number(e.key) - 1]
        if (id != null) {
          e.preventDefault()
          goToFile(id)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openIds, activeId, fileMap, routeFileId])

  function onTabKeyDown(e: React.KeyboardEvent, index: number) {
    const map: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: openIds.length - 1,
    }
    const target = map[e.key]
    if (target === undefined) return
    e.preventDefault()
    const id = openIds[(target + openIds.length) % openIds.length]
    if (id != null) goToFile(id)
  }

  if (openIds.length === 0) return null

  return (
    <div
      role="tablist"
      aria-label="Open files"
      className="flex flex-shrink-0 items-stretch gap-1 overflow-x-auto border-b border-line bg-surface px-2 py-1"
    >
      {openIds.map((id, i) => {
        const f = fileMap.get(id)
        if (!f) return null
        const selected = routeFileId === id
        return (
          <div
            key={id}
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            draggable
            onDragStart={() => (dragFrom.current = i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragFrom.current !== null) move(dragFrom.current, i)
              dragFrom.current = null
            }}
            onClick={() => goToFile(id)}
            onKeyDown={(e) => {
              onTabKeyDown(e, i)
              if (e.key === 'Enter' || e.key === ' ') goToFile(id)
            }}
            onAuxClick={(e) => {
              if (e.button === 1) {
                e.preventDefault()
                closeAndMaybeNavigate(id)
              }
            }}
            className={cn(
              'group flex min-w-[8rem] max-w-[14rem] cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent',
              selected
                ? 'bg-accent-tint font-medium text-accent'
                : 'text-muted hover:bg-surface-2 hover:text-ink',
            )}
          >
            {fileIcon(f.type)}
            <span className="flex-1 truncate">{f.name}</span>
            <span
              role="button"
              tabIndex={-1}
              aria-label={`Close ${f.name}`}
              onClick={(e) => {
                e.stopPropagation()
                closeAndMaybeNavigate(id)
              }}
              className="flex-shrink-0 rounded p-0.5 opacity-0 transition hover:bg-black/10 group-hover:opacity-100"
            >
              <X size={12} />
            </span>
          </div>
        )
      })}
    </div>
  )
}

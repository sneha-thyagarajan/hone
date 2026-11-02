import type { HoneFile } from '@/db/types'
import { TYPE_META, type AiType } from './types'

/** Files that can be used as AI sources: notes and uploads only (not AI-made). */
export function selectableSources(files: HoneFile[]): HoneFile[] {
  return files.filter((f) => f.type === 'note' || f.type === 'upload')
}

/** A rough page count for a single source file. */
export function filePageCount(file: HoneFile): number {
  if (file.type === 'upload') return (file.meta?.pageCount as number | undefined) ?? 1
  const pages = file.meta?.pages
  if (Array.isArray(pages)) return Math.max(1, pages.length)
  const len = (file.content ?? '').length
  return Math.max(1, Math.ceil(len / 1800))
}

/** Rough total "pages" across the selected source files (for the size hint). */
export function estimatePages(files: HoneFile[]): number {
  return files.reduce((n, f) => n + filePageCount(f), 0)
}

/** Whether a folder has anything the AI can generate from. */
export function hasGeneratableSources(files: HoneFile[]): boolean {
  return selectableSources(files).length > 0
}

/** Default AI file name like "Quiz · Data Structures", numbered if taken. */
export function defaultFileName(type: AiType, folderName: string, existingNames: string[]): string {
  const base = `${TYPE_META[type].label} · ${folderName}`
  if (!existingNames.includes(base)) return base
  let n = 2
  while (existingNames.includes(`${base} (${n})`)) n++
  return `${base} (${n})`
}

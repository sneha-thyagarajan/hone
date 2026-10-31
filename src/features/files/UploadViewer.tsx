import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Trash2, AlertTriangle, FileText, ExternalLink } from 'lucide-react'
import { useFile } from '@/features/files/useFiles'
import { useChunks } from '@/features/files/useChunks'
import { useBlobUrl } from '@/features/files/useBlobUrl'
import { deleteFile } from '@/features/files/fileActions'
import type { Chunk } from '@/db/types'

export default function UploadViewer() {
  const { folderId, fileId } = useParams()
  const navigate = useNavigate()
  const file = useFile(fileId ? Number(fileId) : undefined)
  const chunks = useChunks(fileId ? Number(fileId) : undefined)
  const blobUrl = useBlobUrl(file?.blobId)

  const pages = useMemo(() => groupByPage(chunks), [chunks])
  const parseError = file?.meta?.parseError as string | undefined
  const ext = (file?.meta?.ext as string) ?? 'file'
  const isPdf = ext === 'pdf'
  const isDocx = ext === 'docx'

  async function handleDelete() {
    if (!file) return
    if (!window.confirm(`Delete "${file.name}"? This cannot be undone.`)) return
    await deleteFile(file.id!)
    navigate(`/folders/${folderId}`)
  }

  if (!file) {
    return <div className="flex flex-1 items-center justify-center text-muted">File not found.</div>
  }

  const hasText = pages.length > 0

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-8 py-6">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <button
          onClick={() => navigate(`/folders/${folderId}`)}
          className="flex h-8 w-8 items-center justify-center rounded-btn text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          aria-label="Back to folder"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex flex-1 items-center gap-2">
          <FileText size={18} className="text-accent" />
          <h1 className="font-serif text-xl font-semibold text-heading">{file.name}</h1>
          <span className="rounded-full bg-accent-tint px-2 py-0.5 text-[11px] font-semibold uppercase text-accent">
            {ext}
          </span>
        </div>
        {blobUrl && (
          <a
            href={blobUrl}
            target="_blank"
            rel="noreferrer"
            download={file.name}
            className="flex min-h-[36px] items-center gap-1.5 rounded-btn border border-line bg-surface px-3 text-sm font-medium text-ink shadow-xs transition-colors hover:bg-surface-2"
          >
            <ExternalLink size={14} />
            Open original
          </a>
        )}
        <button
          onClick={handleDelete}
          className="flex min-h-[36px] items-center gap-1.5 rounded-btn px-3 text-sm font-medium text-danger-text transition-colors hover:bg-danger-tint"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>

      {/* Original document (PDFs render natively) */}
      {isPdf && blobUrl && (
        <iframe
          title={file.name}
          src={blobUrl}
          className="mb-5 h-[75vh] w-full rounded-card border border-line bg-surface shadow-card"
        />
      )}

      {/* Extracted text */}
      {parseError ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-line bg-surface py-12 text-center shadow-card">
          <AlertTriangle size={26} className="text-danger-text" />
          <div>
            <p className="font-medium text-ink">We couldn't extract text from this file.</p>
            <p className="mt-1 text-sm text-muted">
              {blobUrl ? 'Use “Open original” to view it.' : 'The original is still saved.'}
            </p>
          </div>
        </div>
      ) : hasText ? (
        <div className="flex flex-col gap-4">
          {isPdf && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
              Extracted text
            </p>
          )}
          {pages.map(({ page, text }) => (
            <section key={page} className="rounded-card border border-line bg-surface p-5 shadow-card">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                {isDocx ? 'Document' : `Page ${page}`}
              </p>
              <p className="whitespace-pre-wrap text-[15px] leading-7 text-ink">{text}</p>
            </section>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-card border border-line bg-surface py-12 text-center text-muted shadow-card">
          <p className="text-sm">
            {isPdf
              ? 'No selectable text layer (this looks like a scanned PDF). The document is shown above.'
              : 'No text was found in this file.'}
          </p>
          {!isPdf && blobUrl && <p className="text-xs">Use “Open original” to view it.</p>}
        </div>
      )}
    </div>
  )
}

function groupByPage(chunks: Chunk[]): { page: number; text: string }[] {
  const map = new Map<number, string[]>()
  for (const c of chunks) {
    const page = c.page ?? 1
    if (!map.has(page)) map.set(page, [])
    map.get(page)!.push(c.text)
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([page, texts]) => ({ page, text: texts.join('\n\n') }))
}

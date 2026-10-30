import { Check, FileText, Loader2, X, AlertTriangle } from 'lucide-react'
import { useUploadStore } from './uploadStore'

export function UploadProgress() {
  const jobs = useUploadStore((s) => s.jobs)
  const dismiss = useUploadStore((s) => s.dismiss)

  if (jobs.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
      {jobs.map((job) => (
        <div
          key={job.id}
          className="flex items-start gap-3 rounded-card border border-line bg-surface p-3 shadow-lg"
        >
          <span className="mt-0.5 flex-shrink-0">
            {job.status === 'parsing' && (
              <Loader2 size={16} className="animate-spin text-accent" />
            )}
            {job.status === 'done' && <Check size={16} className="text-success-text" />}
            {job.status === 'error' && <AlertTriangle size={16} className="text-danger-text" />}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <FileText size={12} className="flex-shrink-0 text-muted" />
              <span className="truncate text-sm font-medium text-ink">{job.name}</span>
            </div>
            <p className="mt-0.5 text-xs text-muted">
              {job.status === 'parsing' &&
                (job.total ? `Reading page ${job.page} of ${job.total}…` : 'Reading…')}
              {job.status === 'done' && `Added · ${job.total ?? 0} pages`}
              {job.status === 'error' && job.error}
            </p>
          </div>

          <button
            onClick={() => dismiss(job.id)}
            className="flex-shrink-0 rounded p-0.5 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

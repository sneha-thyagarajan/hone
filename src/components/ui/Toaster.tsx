import { Check, X, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/lib/toast'

export function Toaster() {
  const toasts = useToast((s) => s.toasts)
  const dismiss = useToast((s) => s.dismiss)

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-2.5 rounded-btn border border-line bg-surface py-2.5 pl-3 pr-2 shadow-lg"
        >
          <span className="flex-shrink-0">
            {t.kind === 'success' && <Check size={15} className="text-success-text" />}
            {t.kind === 'error' && <AlertTriangle size={15} className="text-danger-text" />}
            {t.kind === 'info' && <Info size={15} className="text-accent" />}
          </span>
          <span className="text-sm font-medium text-ink">{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            className={cn(
              'flex-shrink-0 rounded p-0.5 text-muted transition-colors hover:bg-surface-2 hover:text-ink',
            )}
            aria-label="Dismiss"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  )
}

import { cn } from '@/lib/utils'

interface ProgressBarProps {
  /** 0–100 */
  value: number
  className?: string
}

export function ProgressBar({ value, className }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-pink-tint', className)}>
      <div
        className="progress-fill h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

import { cn } from '@/lib/utils'

interface ComingSoonProps {
  icon: React.ReactNode
  title: string
  description: string
  className?: string
}

export function ComingSoon({ icon, title, description, className }: ComingSoonProps) {
  return (
    <div className={cn('flex flex-1 items-center justify-center p-8', className)}>
      <div className="flex max-w-md flex-col items-center gap-5 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-surface text-accent shadow-card">
          {icon}
        </div>
        <div>
          <h1 className="font-serif text-2xl font-semibold text-heading">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
        </div>
        <span className="rounded-full bg-accent-tint px-3 py-1 text-xs font-semibold text-accent">
          Coming soon
        </span>
      </div>
    </div>
  )
}

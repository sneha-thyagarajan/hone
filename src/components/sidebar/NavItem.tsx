import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface NavItemProps {
  to: string
  icon?: React.ReactNode
  children: React.ReactNode
}

export function NavItem({ to, icon, children }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'group flex min-h-[42px] items-center gap-2.5 rounded-btn px-3 text-sm font-medium transition-colors',
          isActive
            ? 'bg-white/10 text-cream shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]'
            : 'text-sidebar-text hover:bg-white/5 hover:text-cream',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className={cn('transition-colors', isActive ? 'text-pink' : 'text-sidebar-muted group-hover:text-sidebar-text')}>
            {icon}
          </span>
          {children}
        </>
      )}
    </NavLink>
  )
}

import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface NavItemProps {
  to: string
  children: React.ReactNode
}

export function NavItem({ to, children }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex min-h-[44px] items-center rounded-btn px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-accent-tint font-semibold text-accent'
            : 'text-ink hover:bg-line',
        )
      }
    >
      {children}
    </NavLink>
  )
}

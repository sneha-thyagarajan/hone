import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/sidebar/Sidebar'

export function RootLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="app-surface flex flex-1 flex-col overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/sidebar/Sidebar'

export function RootLayout() {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

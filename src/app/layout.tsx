import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { UploadProgress } from '@/features/files/upload/UploadProgress'
import { Toaster } from '@/components/ui/Toaster'

export function RootLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="app-surface flex flex-1 flex-col overflow-auto">
        <Outlet />
      </main>
      <UploadProgress />
      <Toaster />
    </div>
  )
}

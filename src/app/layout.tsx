import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { UploadProgress } from '@/features/files/upload/UploadProgress'
import { Toaster } from '@/components/ui/Toaster'
import { TabBar } from '@/features/tabs/TabBar'

export function RootLayout() {
  const location = useLocation()
  // The study session is full-screen: no tab bar there.
  const showTabs = !location.pathname.endsWith('/study')

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {showTabs && <TabBar />}
        <main className="app-surface flex min-h-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </main>
      </div>
      <UploadProgress />
      <Toaster />
    </div>
  )
}

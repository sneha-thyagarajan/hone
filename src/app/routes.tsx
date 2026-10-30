import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from './layout'
import HomePage from './pages/home'
import PlannerPage from './pages/planner'
import FolderWorkspacePage from './pages/folder'
import FileDispatcher from './pages/file-dispatcher'
import StudySessionPage from './pages/study-session'
import SettingsPage from './pages/settings'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'planner', element: <PlannerPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'folders/:folderId', element: <FolderWorkspacePage /> },
      { path: 'folders/:folderId/files/:fileId', element: <FileDispatcher /> },
      { path: 'folders/:folderId/files/:fileId/study', element: <StudySessionPage /> },
    ],
  },
])

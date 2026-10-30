import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from './layout'
import HomePage from './pages/home'
import PlannerPage from './pages/planner'
import FolderWorkspacePage from './pages/folder'
import NoteEditorPage from './pages/note-editor'
import StudySessionPage from './pages/study-session'
import CodePracticePage from './pages/code-practice'
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
      {
        path: 'folders/:folderId/files/:fileId',
        // Rendered by FolderWorkspacePage which dispatches by file.type
        element: <NoteEditorPage />,
      },
      {
        path: 'folders/:folderId/files/:fileId/study',
        element: <StudySessionPage />,
      },
      {
        path: 'folders/:folderId/files/:fileId/code',
        element: <CodePracticePage />,
      },
    ],
  },
])

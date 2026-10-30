import { useParams } from 'react-router-dom'
import { useFile } from '@/features/files/useFiles'
import NoteEditorPage from './note-editor'
import CodePracticePage from './code-practice'

/** Routes to the correct editor based on file.type. */
export default function FileDispatcher() {
  const { fileId } = useParams()
  const file = useFile(fileId ? Number(fileId) : undefined)

  if (!file) {
    return <div className="flex flex-1 items-center justify-center text-muted">Loading…</div>
  }

  if (file.type === 'note' || file.type === 'notes_ai') return <NoteEditorPage />
  if (file.type === 'code') return <CodePracticePage />

  return (
    <div className="flex flex-1 items-center justify-center text-muted">
      No editor for this file type yet.
    </div>
  )
}

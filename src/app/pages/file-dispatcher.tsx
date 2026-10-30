import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useFile } from '@/features/files/useFiles'
import { touchFile } from '@/features/files/fileActions'
import NoteEditorPage from './note-editor'
import CodePracticePage from './code-practice'
import UploadViewer from '@/features/files/UploadViewer'

const CONTINUABLE = new Set(['note', 'notes_ai', 'code', 'flashcards'])

/** Routes to the correct editor based on file.type. */
export default function FileDispatcher() {
  const { fileId } = useParams()
  const file = useFile(fileId ? Number(fileId) : undefined)

  useEffect(() => {
    if (file?.id !== undefined && CONTINUABLE.has(file.type)) touchFile(file.id)
  }, [file?.id, file?.type])

  if (!file) {
    return <div className="flex flex-1 items-center justify-center text-muted">Loading…</div>
  }

  if (file.type === 'note' || file.type === 'notes_ai') return <NoteEditorPage />
  if (file.type === 'code') return <CodePracticePage />
  if (file.type === 'upload') return <UploadViewer />

  return (
    <div className="flex flex-1 items-center justify-center text-muted">
      No editor for this file type yet.
    </div>
  )
}

import { useParams } from 'react-router-dom'
import { useFolder } from '@/features/folders/useFolders'

export default function FolderWorkspacePage() {
  const { folderId } = useParams()
  const folder = useFolder(folderId ? Number(folderId) : undefined)

  return (
    <div className="flex flex-1 items-center justify-center">
      <h1 className="font-serif text-3xl text-ink">
        {folder ? folder.name : 'Folder workspace – coming soon'}
      </h1>
    </div>
  )
}

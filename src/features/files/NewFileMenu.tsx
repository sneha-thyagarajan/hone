import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, FileText, Code, Upload, Sparkles, Plus } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'
import { createFile } from './fileActions'
import { useUploadStore } from './upload/uploadStore'
import { ACCEPT_EXTENSIONS } from '@/parsers/types'

interface Props {
  folderId: number
}

export function NewFileMenu({ folderId }: Props) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const startUploads = useUploadStore((s) => s.startUploads)

  async function handleBlankNote() {
    const id = await createFile({ folderId, type: 'note', name: 'Untitled note' })
    navigate(`/folders/${folderId}/files/${id}`)
  }

  async function handleCodePractice() {
    const id = await createFile({
      folderId,
      type: 'code',
      name: 'New practice',
      meta: { language: 'python' },
    })
    navigate(`/folders/${folderId}/files/${id}`)
  }

  function handleFilesPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (files && files.length) startUploads(folderId, Array.from(files))
    e.target.value = '' // allow re-picking the same file
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPT_EXTENSIONS}
        className="hidden"
        onChange={handleFilesPicked}
      />

      <DropdownMenu.Root open={open} onOpenChange={setOpen}>
        <DropdownMenu.Trigger asChild>
          <button className="btn-primary flex min-h-[44px] items-center gap-1.5 rounded-btn px-4 text-sm font-semibold">
            <Plus size={15} />
            New file
            <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            className="z-50 min-w-[220px] rounded-card border border-line bg-surface py-1 shadow-card"
          >
            <DropdownMenu.Item
              onSelect={() => fileInputRef.current?.click()}
              className="flex cursor-pointer items-start gap-3 px-4 py-2.5 outline-none hover:bg-surface-2"
            >
              <Upload size={16} className="mt-0.5 flex-shrink-0 text-accent" />
              <div>
                <p className="text-sm font-medium text-ink">Upload files</p>
                <p className="text-xs text-muted">PDF, PPTX, DOCX, Markdown or TXT</p>
              </div>
            </DropdownMenu.Item>

            <DropdownMenu.Item
              onSelect={handleBlankNote}
              className="flex cursor-pointer items-start gap-3 px-4 py-2.5 outline-none hover:bg-surface-2"
            >
              <FileText size={16} className="mt-0.5 flex-shrink-0 text-accent" />
              <div>
                <p className="text-sm font-medium text-ink">Blank note</p>
                <p className="text-xs text-muted">Write Markdown notes</p>
              </div>
            </DropdownMenu.Item>

            <DropdownMenu.Item
              onSelect={handleCodePractice}
              className="flex cursor-pointer items-start gap-3 px-4 py-2.5 outline-none hover:bg-surface-2"
            >
              <Code size={16} className="mt-0.5 flex-shrink-0 text-accent" />
              <div>
                <p className="text-sm font-medium text-ink">Code practice</p>
                <p className="text-xs text-muted">Python or JavaScript editor</p>
              </div>
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="my-1 h-px bg-line" />

            {/* Enabled in a future step */}
            <div className="flex cursor-not-allowed items-start gap-3 px-4 py-2.5 opacity-40">
              <Sparkles size={16} className="mt-0.5 flex-shrink-0 text-muted" />
              <div>
                <p className="text-sm font-medium text-ink">AI-generated file</p>
                <p className="text-xs text-muted">Use the AI agent — coming soon</p>
              </div>
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </>
  )
}

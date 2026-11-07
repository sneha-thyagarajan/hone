import { useCallback, useEffect, useRef, useState } from 'react'
import { saveFileContent } from '@/features/files/fileActions'

type SaveStatus = 'idle' | 'saving' | 'saved'

const DEBOUNCE_MS = 800

export function useAutosave(fileId: number | undefined, enabled = true) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingContentRef = useRef<string | null>(null)

  const save = useCallback(
    (content: string) => {
      if (!enabled || fileId === undefined) return
      pendingContentRef.current = content
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(async () => {
        setStatus('saving')
        await saveFileContent(fileId, content)
        pendingContentRef.current = null
        setStatus('saved')
        setTimeout(() => setStatus('idle'), 2000)
      }, DEBOUNCE_MS)
    },
    [fileId, enabled],
  )

  // Flush any pending save immediately on unmount so content is never lost
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        if (fileId !== undefined && pendingContentRef.current !== null) {
          saveFileContent(fileId, pendingContentRef.current)
        }
      }
    }
  }, [fileId])

  return { save, status }
}

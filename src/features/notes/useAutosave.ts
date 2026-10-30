import { useCallback, useEffect, useRef, useState } from 'react'
import { saveFileContent } from '@/features/files/fileActions'

type SaveStatus = 'idle' | 'saving' | 'saved'

const DEBOUNCE_MS = 800

export function useAutosave(fileId: number | undefined, enabled = true) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const save = useCallback(
    (content: string) => {
      if (!enabled || fileId === undefined) return
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(async () => {
        setStatus('saving')
        await saveFileContent(fileId, content)
        setStatus('saved')
        // Reset to idle after 2 s so the label fades away
        setTimeout(() => setStatus('idle'), 2000)
      }, DEBOUNCE_MS)
    },
    [fileId, enabled],
  )

  // Flush on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return { save, status }
}

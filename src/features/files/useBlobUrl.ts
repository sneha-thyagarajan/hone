import { useEffect, useState } from 'react'
import { db } from '@/db'

/** Resolve a stored blob id to an object URL, revoking it on cleanup. */
export function useBlobUrl(blobId: string | undefined): string | undefined {
  const [url, setUrl] = useState<string>()

  useEffect(() => {
    if (!blobId) return
    let active = true
    let created: string | undefined
    db.blobs.get(blobId).then((rec) => {
      if (!active || !rec) return
      created = URL.createObjectURL(rec.data)
      setUrl(created)
    })
    return () => {
      active = false
      if (created) URL.revokeObjectURL(created)
    }
  }, [blobId])

  return url
}

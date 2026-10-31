import { db } from '@/db'

const MAX_WIDTH = 1600

/** Downscale an image to at most `maxWidth` px wide (keeps aspect ratio). */
export async function resizeImage(file: Blob, maxWidth = MAX_WIDTH): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  try {
    if (bitmap.width <= maxWidth) return file
    const scale = maxWidth / bitmap.width
    const w = maxWidth
    const h = Math.round(bitmap.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, w, h)
    return await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b ?? file), 'image/jpeg', 0.85),
    )
  } finally {
    bitmap.close?.()
  }
}

/** Resize and store an image, returning its blob id. */
export async function storeImage(file: File): Promise<string> {
  const resized = await resizeImage(file)
  const id = crypto.randomUUID()
  await db.blobs.add({
    id,
    name: file.name || 'image',
    type: resized.type || 'image/jpeg',
    data: resized,
  })
  return id
}

/** Delete image blobs by id (used when a tab or image is removed). */
export async function deleteImageBlobs(ids: string[]): Promise<void> {
  if (ids.length) await db.blobs.bulkDelete(ids)
}

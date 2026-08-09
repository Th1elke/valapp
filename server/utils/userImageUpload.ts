import { del, list, put } from '@vercel/blob'
import type { H3Event } from 'h3'

const MAX_SIZE = 5 * 1024 * 1024
const MIME_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

/** Saves a single-file multipart upload to Vercel Blob under <subdir>/<userId>.<ext> and returns its public URL. */
export async function saveUserImage(event: H3Event, userId: string, fieldName: string, subdir: string): Promise<string> {
  const parts = await readMultipartFormData(event)
  const file = parts?.find((p) => p.name === fieldName && p.filename)
  if (!file) throw createError({ statusCode: 400, statusMessage: `Envie um arquivo de imagem no campo "${fieldName}".` })

  const ext = file.type && MIME_EXT[file.type]
  if (!ext) throw createError({ statusCode: 400, statusMessage: 'Formato inválido. Use PNG, JPEG, WEBP ou GIF.' })
  if (file.data.length > MAX_SIZE) throw createError({ statusCode: 400, statusMessage: 'Imagem muito grande (máximo 5MB).' })

  // Clean up any previous upload for this user in this subdir first — extension can change between
  // uploads (e.g. png -> webp), so a plain overwrite by pathname wouldn't catch that.
  const { blobs: existing } = await list({ prefix: `${subdir}/${userId}.` })
  await Promise.all(existing.map((blob) => del(blob.url).catch(() => {})))

  const { url } = await put(`${subdir}/${userId}.${ext}`, file.data, {
    access: 'public',
    contentType: file.type,
    addRandomSuffix: false,
  })

  // Cache-bust: the pathname is stable per user/subdir, so browsers/CDN would otherwise keep
  // showing the previous image after a re-upload with the same extension.
  return `${url}?v=${Date.now()}`
}

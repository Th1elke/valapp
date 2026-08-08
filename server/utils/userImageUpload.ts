import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { H3Event } from 'h3'

const MAX_SIZE = 5 * 1024 * 1024
const MIME_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

/** Saves a single-file multipart upload under public/uploads/<subdir>/<userId>.<ext> and returns its public URL. */
export async function saveUserImage(event: H3Event, userId: string, fieldName: string, subdir: string): Promise<string> {
  const parts = await readMultipartFormData(event)
  const file = parts?.find((p) => p.name === fieldName && p.filename)
  if (!file) throw createError({ statusCode: 400, statusMessage: `Envie um arquivo de imagem no campo "${fieldName}".` })

  const ext = file.type && MIME_EXT[file.type]
  if (!ext) throw createError({ statusCode: 400, statusMessage: 'Formato inválido. Use PNG, JPEG, WEBP ou GIF.' })
  if (file.data.length > MAX_SIZE) throw createError({ statusCode: 400, statusMessage: 'Imagem muito grande (máximo 5MB).' })

  const dir = join(process.cwd(), 'public', 'uploads', subdir)
  await mkdir(dir, { recursive: true })

  const existing = await readdir(dir).catch(() => [] as string[])
  await Promise.all(
    existing.filter((name) => name.startsWith(`${userId}.`)).map((name) => rm(join(dir, name)).catch(() => {})),
  )

  await writeFile(join(dir, `${userId}.${ext}`), file.data)

  return `/uploads/${subdir}/${userId}.${ext}?v=${Date.now()}`
}

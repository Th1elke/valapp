import { eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { users } from '~~/db/schema'
import type { UserStateDTO } from '#shared/types'

const MAX_NAME_LENGTH = 30

export default defineEventHandler(async (event): Promise<UserStateDTO> => {
  const userId = await requireUserId(event)
  const body = await readBody(event)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  if (!name) throw createError({ statusCode: 400, statusMessage: 'Nome não pode ficar vazio.' })
  if (name.length > MAX_NAME_LENGTH) {
    throw createError({ statusCode: 400, statusMessage: `Nome muito longo (máximo ${MAX_NAME_LENGTH} caracteres).` })
  }

  const updated = db
    .update(users)
    .set({ name, updatedAt: new Date().toISOString() })
    .where(eq(users.id, userId))
    .returning()
    .get()
  if (!updated) throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' })

  return toUserStateDTO(updated)
})

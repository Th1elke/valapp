import { eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { users } from '~~/db/schema'
import type { UserStateDTO } from '#shared/types'

export default defineEventHandler(async (event): Promise<UserStateDTO> => {
  const userId = await requireUserId(event)
  const user = db.select().from(users).where(eq(users.id, userId)).get()
  if (!user) throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' })

  return toUserStateDTO(user)
})

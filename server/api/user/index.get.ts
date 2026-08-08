import { eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { users } from '~~/db/schema'
import { DEMO_USER_ID } from '#shared/constants'
import type { UserStateDTO } from '#shared/types'

export default defineEventHandler((): UserStateDTO => {
  const user = db.select().from(users).where(eq(users.id, DEMO_USER_ID)).get()
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Usuário demo não encontrado. Rode `npm run db:seed`.' })
  }

  return toUserStateDTO(user)
})

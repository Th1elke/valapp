import { eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { users } from '~~/db/schema'
import type { UserStateDTO } from '#shared/types'

export default defineEventHandler(async (event): Promise<UserStateDTO> => {
  const userId = await requireUserId(event)

  return db.transaction(async (tx): Promise<UserStateDTO> => {
    const [user] = await tx.select().from(users).where(eq(users.id, userId))
    if (!user) throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' })

    const skills = await getUnlockedSkillIds(tx, userId)
    const renewed = await ensureWeeklyShield(tx, user, skills)
    return await toUserStateDTO(renewed, tx)
  })
})

import { eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { users } from '~~/db/schema'
import type { UserStateDTO } from '#shared/types'

export default defineEventHandler(async (event): Promise<UserStateDTO> => {
  const userId = await requireUserId(event)
  const avatarUrl = await saveUserImage(event, userId, 'avatar', 'avatars')

  await db.update(users).set({ avatarUrl, updatedAt: new Date().toISOString() }).where(eq(users.id, userId))

  const [updated] = await db.select().from(users).where(eq(users.id, userId))
  return toUserStateDTO(updated!)
})

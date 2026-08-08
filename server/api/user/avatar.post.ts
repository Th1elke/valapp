import { eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { users } from '~~/db/schema'
import type { UserStateDTO } from '#shared/types'

export default defineEventHandler(async (event): Promise<UserStateDTO> => {
  const userId = await requireUserId(event)
  const avatarUrl = await saveUserImage(event, userId, 'avatar', 'avatars')

  db.update(users).set({ avatarUrl, updatedAt: new Date().toISOString() }).where(eq(users.id, userId)).run()

  const updated = db.select().from(users).where(eq(users.id, userId)).get()!
  return toUserStateDTO(updated)
})

import { eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { users } from '~~/db/schema'
import { DEMO_USER_ID } from '#shared/constants'
import type { UserStateDTO } from '#shared/types'

export default defineEventHandler(async (event): Promise<UserStateDTO> => {
  const avatarUrl = await saveUserImage(event, 'avatar', 'avatars')

  db.update(users).set({ avatarUrl, updatedAt: new Date().toISOString() }).where(eq(users.id, DEMO_USER_ID)).run()

  const updated = db.select().from(users).where(eq(users.id, DEMO_USER_ID)).get()!
  return toUserStateDTO(updated)
})

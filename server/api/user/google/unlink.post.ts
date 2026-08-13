import { eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { users } from '~~/db/schema'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)

  const [user] = await db.select({ googleAccessToken: users.googleAccessToken }).from(users).where(eq(users.id, userId))
  if (user?.googleAccessToken) {
    try {
      await $fetch(`https://oauth2.googleapis.com/revoke?token=${user.googleAccessToken}`, { method: 'POST' })
    } catch {
      // best-effort — não bloqueia o desvincular se o Google estiver indisponível
    }
  }

  await db
    .update(users)
    .set({
      googleAccessToken: null,
      googleRefreshToken: null,
      googleTokenExpiresAt: null,
      googleEmail: null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, userId))

  return { ok: true }
})

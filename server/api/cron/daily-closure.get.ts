import { db } from '~~/db/client'
import { users } from '~~/db/schema'

/**
 * Vercel Cron Job entry point — closes "yesterday" for every user in one run, reusing the exact
 * same idempotent logic as the manual button (server/utils/dailyClosure.ts). Vercel invokes this
 * via HTTP GET and automatically sends `Authorization: Bearer $CRON_SECRET` when a CRON_SECRET env
 * var is set on the project — that's the only auth this route accepts; it's deliberately NOT
 * gated by requireUserId/session, since there's no logged-in user when the cron fires. Schedule
 * lives in vercel.json. Per-user failures are caught individually so one broken account can't
 * stop the rest of the batch from closing.
 */
export default defineEventHandler(async (event) => {
  const secret = process.env.CRON_SECRET
  if (!secret) throw createError({ statusCode: 500, statusMessage: 'CRON_SECRET não configurado.' })

  const auth = getHeader(event, 'authorization')
  if (auth !== `Bearer ${secret}`) throw createError({ statusCode: 401, statusMessage: 'Não autorizado.' })

  const closureDate = yesterdayStr()
  const allUsers = await db.select({ id: users.id }).from(users)

  let processed = 0
  const errors: Array<{ userId: string; message: string }> = []

  for (const { id: userId } of allUsers) {
    try {
      await closeDayForUser(userId, closureDate)
      processed++
    } catch (err) {
      errors.push({ userId, message: err instanceof Error ? err.message : 'erro desconhecido' })
    }
  }

  return { closureDate, totalUsers: allUsers.length, processed, failed: errors.length, errors }
})

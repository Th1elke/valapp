/**
 * Manual trigger: closes a given day (default "yesterday") for the logged-in user only. The
 * shared logic (idempotent per user+date) lives in server/utils/dailyClosure.ts — the same
 * function backs the automatic Vercel Cron job in server/api/cron/daily-closure.get.ts, so a user
 * clicking this button and the cron both landing on the same day is harmless (the second call
 * just returns the already-processed closure).
 */
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const body = await readBody(event).catch(() => ({}))
  const closureDate: string = body?.date ?? yesterdayStr()

  return closeDayForUser(userId, closureDate)
})

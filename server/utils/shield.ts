import { eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { users } from '~~/db/schema'
import { getMaxShields } from '#shared/economy'
import { weekStartStr } from '#shared/date'

type Writable = Pick<typeof db, 'select' | 'update'>

/**
 * Weekly free-shield renewal (docs 5.2). There's no cron yet (PROJETO.md decisão #3), so this
 * runs lazily whenever the user's row is touched — idempotent, since it only writes when the
 * stored `shieldWeekStart` isn't the current week yet.
 */
export function ensureWeeklyShield(tx: Writable, user: typeof users.$inferSelect, skills: readonly string[]): typeof users.$inferSelect {
  const currentWeekStart = weekStartStr()
  if (user.shieldWeekStart === currentWeekStart) return user

  return tx
    .update(users)
    .set({
      shieldsRemaining: Math.min(getMaxShields(skills), user.shieldsRemaining + 1),
      shieldWeekStart: currentWeekStart,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, user.id))
    .returning()
    .get()!
}

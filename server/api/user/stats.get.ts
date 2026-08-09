import { and, eq, sql } from 'drizzle-orm'
import { db } from '~~/db/client'
import { checkIns, habitCategories, habits, xpEvents } from '~~/db/schema'
import type { AttributeStatsDTO } from '#shared/types'

export default defineEventHandler(async (event): Promise<AttributeStatsDTO[]> => {
  const userId = await requireUserId(event)

  const rows = await db
    .select({ category: habits.category, xp: sql<number>`coalesce(sum(${checkIns.xpAwarded}), 0)` })
    .from(habits)
    .leftJoin(checkIns, eq(checkIns.habitId, habits.id))
    .where(eq(habits.userId, userId))
    .groupBy(habits.category)

  const byCategory = new Map(rows.map((r) => [r.category, Number(r.xp)]))

  // Grimório XP counts entirely toward Inteligência (Mente) — docs section 12.3.
  const [grimoireXp] = await db
    .select({ total: sql<number>`coalesce(sum(${xpEvents.amount}), 0)` })
    .from(xpEvents)
    .where(and(eq(xpEvents.userId, userId), eq(xpEvents.type, 'grimorio')))

  byCategory.set('mente', (byCategory.get('mente') ?? 0) + Number(grimoireXp?.total ?? 0))

  return habitCategories.map((category) => ({ category, xp: byCategory.get(category) ?? 0 }))
})

import { and, eq, sql } from 'drizzle-orm'
import { db } from '~~/db/client'
import { checkIns, habitCategories, habits, xpEvents } from '~~/db/schema'
import { DEMO_USER_ID } from '#shared/constants'
import type { AttributeStatsDTO } from '#shared/types'

export default defineEventHandler((): AttributeStatsDTO[] => {
  const rows = db
    .select({ category: habits.category, xp: sql<number>`coalesce(sum(${checkIns.xpAwarded}), 0)` })
    .from(habits)
    .leftJoin(checkIns, eq(checkIns.habitId, habits.id))
    .where(eq(habits.userId, DEMO_USER_ID))
    .groupBy(habits.category)
    .all()

  const byCategory = new Map(rows.map((r) => [r.category, Number(r.xp)]))

  // Grimório XP counts entirely toward Inteligência (Mente) — docs section 12.3.
  const grimoireXp = db
    .select({ total: sql<number>`coalesce(sum(${xpEvents.amount}), 0)` })
    .from(xpEvents)
    .where(and(eq(xpEvents.userId, DEMO_USER_ID), eq(xpEvents.type, 'grimorio')))
    .get()

  byCategory.set('mente', (byCategory.get('mente') ?? 0) + Number(grimoireXp?.total ?? 0))

  return habitCategories.map((category) => ({ category, xp: byCategory.get(category) ?? 0 }))
})

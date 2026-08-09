import { and, eq, sql } from 'drizzle-orm'
import { db } from '~~/db/client'
import { checkIns, habitCategories, habits, xpEvents } from '~~/db/schema'
import { GRIMOIRE_ATTRIBUTE_SHARE } from '#shared/gamification'
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

  // Grimório XP conta pra Inteligência (Mente) — docs seção 12.3 — mas só uma fração
  // (GRIMOIRE_ATTRIBUTE_SHARE), pra não dominar o radar depois de poucas batalhas comparado ao
  // ritmo mais lento dos check-ins de hábito. Não afeta o XP/nível do jogador, só o atributo.
  const [grimoireXp] = await db
    .select({ total: sql<number>`coalesce(sum(${xpEvents.amount}), 0)` })
    .from(xpEvents)
    .where(and(eq(xpEvents.userId, userId), eq(xpEvents.type, 'grimorio')))

  const grimoireAttributeXp = Math.round(Number(grimoireXp?.total ?? 0) * GRIMOIRE_ATTRIBUTE_SHARE)
  byCategory.set('mente', (byCategory.get('mente') ?? 0) + grimoireAttributeXp)

  return habitCategories.map((category) => ({ category, xp: byCategory.get(category) ?? 0 }))
})

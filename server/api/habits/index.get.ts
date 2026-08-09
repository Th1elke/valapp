import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { checkIns, habits } from '~~/db/schema'
import type { HabitDTO } from '#shared/types'

export default defineEventHandler(async (event): Promise<HabitDTO[]> => {
  const userId = await requireUserId(event)
  const rows = await db.select().from(habits).where(eq(habits.userId, userId))
  const today = todayStr()

  const todaysCheckIns = new Set(
    (await db.select().from(checkIns).where(and(eq(checkIns.userId, userId), eq(checkIns.checkinDate, today)))).map(
      (c) => c.habitId,
    ),
  )

  return rows
    .filter((h) => h.status !== 'arquivado')
    .map((h) => ({
      id: h.id,
      name: h.name,
      category: h.category,
      difficulty: h.difficulty,
      frequency: h.frequency,
      customDays: h.customDays,
      status: h.status,
      streakCount: h.streakCount,
      longestStreak: h.longestStreak,
      lastBrokenStreak: h.lastBrokenStreak,
      dominatedAt: h.dominatedAt,
      doneToday: todaysCheckIns.has(h.id),
    }))
})

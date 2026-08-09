import { and, eq, gte } from 'drizzle-orm'
import { db } from '~~/db/client'
import { checkIns, habits } from '~~/db/schema'
import { weekStartStr } from '#shared/date'
import type { HabitDTO } from '#shared/types'

export default defineEventHandler(async (event): Promise<HabitDTO[]> => {
  const userId = await requireUserId(event)
  await resumeExpiredPauses(db, userId)

  const rows = await db.select().from(habits).where(eq(habits.userId, userId))
  const today = todayStr()
  const weekStart = weekStartStr(today)

  const todaysCheckIns = new Set(
    (await db.select().from(checkIns).where(and(eq(checkIns.userId, userId), eq(checkIns.checkinDate, today)))).map(
      (c) => c.habitId,
    ),
  )

  const weeklyProgressByHabit = new Map<string, number>()
  for (const c of await db
    .select()
    .from(checkIns)
    .where(and(eq(checkIns.userId, userId), gte(checkIns.checkinDate, weekStart)))) {
    weeklyProgressByHabit.set(c.habitId, (weeklyProgressByHabit.get(c.habitId) ?? 0) + 1)
  }

  return rows
    .filter((h) => h.status !== 'arquivado')
    .map((h) => ({
      id: h.id,
      name: h.name,
      category: h.category,
      difficulty: h.difficulty,
      frequency: h.frequency,
      customDays: h.customDays,
      weeklyTarget: h.weeklyTarget,
      weeklyProgress: h.frequency === 'semanal' ? (weeklyProgressByHabit.get(h.id) ?? 0) : null,
      status: h.status,
      pausedUntil: h.pausedUntil,
      streakCount: h.streakCount,
      longestStreak: h.longestStreak,
      lastBrokenStreak: h.lastBrokenStreak,
      dominatedAt: h.dominatedAt,
      doneToday: todaysCheckIns.has(h.id),
    }))
})

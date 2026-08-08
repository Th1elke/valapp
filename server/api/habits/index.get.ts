import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { checkIns, habits } from '~~/db/schema'
import { DEMO_USER_ID } from '#shared/constants'
import type { HabitDTO } from '#shared/types'

export default defineEventHandler((): HabitDTO[] => {
  const rows = db.select().from(habits).where(eq(habits.userId, DEMO_USER_ID)).all()
  const today = todayStr()

  return rows
    .filter((h) => h.status !== 'arquivado')
    .map((h) => {
      const done = db
        .select()
        .from(checkIns)
        .where(and(eq(checkIns.habitId, h.id), eq(checkIns.checkinDate, today)))
        .get()

      return {
        id: h.id,
        name: h.name,
        category: h.category,
        difficulty: h.difficulty,
        frequency: h.frequency,
        status: h.status,
        streakCount: h.streakCount,
        longestStreak: h.longestStreak,
        lastBrokenStreak: h.lastBrokenStreak,
        dominatedAt: h.dominatedAt,
        doneToday: !!done,
      }
    })
})

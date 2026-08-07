import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { checkIns, goldEvents, habits, users, xpEvents } from '~~/db/schema'
import { DEMO_USER_ID } from '#shared/constants'
import { computeCheckinGold, computeCheckinXp, levelForXp } from '#shared/gamification'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id é obrigatório.' })

  const today = todayStr()

  return db.transaction((tx) => {
    const habit = tx.select().from(habits).where(and(eq(habits.id, id), eq(habits.userId, DEMO_USER_ID))).get()
    if (!habit) throw createError({ statusCode: 404, statusMessage: 'Hábito não encontrado.' })
    if (habit.status !== 'ativo') {
      throw createError({ statusCode: 400, statusMessage: 'Hábito pausado ou arquivado não pode receber check-in.' })
    }

    const already = tx
      .select()
      .from(checkIns)
      .where(and(eq(checkIns.habitId, id), eq(checkIns.checkinDate, today)))
      .get()
    if (already) throw createError({ statusCode: 409, statusMessage: 'Check-in de hoje já registrado.' })

    const user = tx.select().from(users).where(eq(users.id, DEMO_USER_ID)).get()
    if (!user) throw createError({ statusCode: 404, statusMessage: 'Usuário demo não encontrado. Rode `npm run db:seed`.' })

    const newStreak = habit.streakCount + 1
    const xpAwarded = computeCheckinXp(habit.difficulty, newStreak, habit.category, user.playerClass, user.level)
    const goldAwarded = computeCheckinGold(habit.difficulty)
    const newXp = user.xp + xpAwarded
    const newGold = user.gold + goldAwarded
    const newLevel = levelForXp(newXp)

    tx.insert(checkIns)
      .values({
        habitId: habit.id,
        userId: DEMO_USER_ID,
        checkinDate: today,
        xpAwarded,
        goldAwarded,
        streakAtCheckin: newStreak,
      })
      .run()

    tx.update(habits)
      .set({
        streakCount: newStreak,
        longestStreak: Math.max(habit.longestStreak, newStreak),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(habits.id, habit.id))
      .run()

    tx.update(users)
      .set({ xp: newXp, level: newLevel, gold: newGold, updatedAt: new Date().toISOString() })
      .where(eq(users.id, DEMO_USER_ID))
      .run()

    tx.insert(xpEvents)
      .values({ userId: DEMO_USER_ID, habitId: habit.id, type: 'checkin', amount: xpAwarded, balanceAfter: newXp })
      .run()

    tx.insert(goldEvents)
      .values({ userId: DEMO_USER_ID, habitId: habit.id, type: 'checkin', amount: goldAwarded, balanceAfter: newGold })
      .run()

    return {
      xpAwarded,
      goldAwarded,
      streak: newStreak,
      xp: newXp,
      gold: newGold,
      level: newLevel,
      leveledUp: newLevel > user.level,
    }
  })
})

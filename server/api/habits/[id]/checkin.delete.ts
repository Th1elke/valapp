import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { checkIns, goldEvents, habits, users, xpEvents } from '~~/db/schema'
import { levelForXp } from '#shared/gamification'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id é obrigatório.' })

  const today = todayStr()

  return db.transaction((tx) => {
    const habit = tx.select().from(habits).where(and(eq(habits.id, id), eq(habits.userId, userId))).get()
    if (!habit) throw createError({ statusCode: 404, statusMessage: 'Hábito não encontrado.' })

    const todayCheckin = tx
      .select()
      .from(checkIns)
      .where(and(eq(checkIns.habitId, id), eq(checkIns.checkinDate, today)))
      .get()
    if (!todayCheckin) throw createError({ statusCode: 404, statusMessage: 'Nenhum check-in de hoje para desfazer.' })

    const user = tx.select().from(users).where(eq(users.id, userId)).get()
    if (!user) throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' })

    const newXp = Math.max(0, user.xp - todayCheckin.xpAwarded)
    const newGold = Math.max(0, user.gold - todayCheckin.goldAwarded)
    const newLevel = levelForXp(newXp)
    const newStreak = Math.max(0, todayCheckin.streakAtCheckin - 1)

    tx.delete(checkIns).where(eq(checkIns.id, todayCheckin.id)).run()

    tx.update(habits).set({ streakCount: newStreak, updatedAt: new Date().toISOString() }).where(eq(habits.id, habit.id)).run()

    tx.update(users)
      .set({ xp: newXp, level: newLevel, gold: newGold, updatedAt: new Date().toISOString() })
      .where(eq(users.id, userId))
      .run()

    tx.insert(xpEvents)
      .values({
        userId,
        habitId: habit.id,
        type: 'ajuste_manual',
        amount: -todayCheckin.xpAwarded,
        balanceAfter: newXp,
      })
      .run()

    tx.insert(goldEvents)
      .values({
        userId,
        habitId: habit.id,
        type: 'ajuste_manual',
        amount: -todayCheckin.goldAwarded,
        balanceAfter: newGold,
      })
      .run()

    return { xp: newXp, gold: newGold, level: newLevel, streak: newStreak }
  })
})

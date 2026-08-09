import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { dailyClosures, habits, shieldTargetTypes, shieldUses, users } from '~~/db/schema'
import { weekStartStr, todayStr } from '#shared/date'
import type { UserStateDTO } from '#shared/types'

/**
 * Spends a shield to protect either a whole day (no HP loss for missed habits, docs 5.2) or a
 * single habit's streak (streak preserved as if checked in, no XP). The effect itself is applied
 * later, at daily-closure time — this route only reserves it and debits the shield.
 */
export default defineEventHandler(async (event): Promise<UserStateDTO> => {
  const userId = await requireUserId(event)
  const body = await readBody(event)
  const targetType = body?.targetType
  const protectedDate: string = body?.date ?? todayStr()
  const habitId = typeof body?.habitId === 'string' ? body.habitId : null

  if (!shieldTargetTypes.includes(targetType)) {
    throw createError({ statusCode: 400, statusMessage: 'Tipo de proteção inválido.' })
  }
  if (targetType === 'protecao_streak' && !habitId) {
    throw createError({ statusCode: 400, statusMessage: 'habitId é obrigatório para proteger uma sequência.' })
  }

  return db.transaction(async (tx): Promise<UserStateDTO> => {
    const [user] = await tx.select().from(users).where(eq(users.id, userId))
    if (!user) throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' })

    const skills = await getUnlockedSkillIds(tx, userId)
    const renewedUser = await ensureWeeklyShield(tx, user, skills)
    if (renewedUser.shieldsRemaining <= 0) {
      throw createError({ statusCode: 400, statusMessage: 'Você não tem escudos disponíveis.' })
    }

    const [alreadyClosed] = await tx
      .select()
      .from(dailyClosures)
      .where(and(eq(dailyClosures.userId, userId), eq(dailyClosures.closureDate, protectedDate)))
    if (alreadyClosed) throw createError({ statusCode: 400, statusMessage: 'Esse dia já foi fechado.' })

    const currentWeekStart = weekStartStr()
    const [alreadyUsedThisWeek] = await tx
      .select()
      .from(shieldUses)
      .where(and(eq(shieldUses.userId, userId), eq(shieldUses.weekStart, currentWeekStart)))
    if (alreadyUsedThisWeek) throw createError({ statusCode: 400, statusMessage: 'Você já usou um escudo essa semana.' })

    if (targetType === 'protecao_streak') {
      const [habit] = await tx.select().from(habits).where(and(eq(habits.id, habitId!), eq(habits.userId, userId)))
      if (!habit) throw createError({ statusCode: 404, statusMessage: 'Hábito não encontrado.' })
      if (habit.status !== 'ativo') throw createError({ statusCode: 400, statusMessage: 'Só é possível proteger um hábito ativo.' })
    }

    await tx.insert(shieldUses)
      .values({ userId, habitId: targetType === 'protecao_streak' ? habitId : null, weekStart: currentWeekStart, targetType, protectedDate })

    const [updated] = await tx
      .update(users)
      .set({ shieldsRemaining: renewedUser.shieldsRemaining - 1, updatedAt: new Date().toISOString() })
      .where(eq(users.id, userId))
      .returning()

    return await toUserStateDTO(updated!, tx)
  })
})

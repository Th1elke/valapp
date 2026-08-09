import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { checkIns, goldEvents, habits, hpEvents, users, xpEvents } from '~~/db/schema'
import {
  HABIT_DOMINATED_BONUS_XP,
  HABIT_DOMINATED_STREAK,
  HP_MAX,
  computeCheckinGold,
  computeCheckinXp,
  golpeDuploChance,
  levelForXp,
  tiroCertoBonus,
} from '#shared/gamification'
import { hasSkill } from '#shared/skills'
import { isHabitScheduled } from '#shared/habitSchedule'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id é obrigatório.' })

  const today = todayStr()

  return db.transaction(async (tx) => {
    const [habit] = await tx.select().from(habits).where(and(eq(habits.id, id), eq(habits.userId, userId)))
    if (!habit) throw createError({ statusCode: 404, statusMessage: 'Hábito não encontrado.' })
    if (habit.status !== 'ativo') {
      throw createError({ statusCode: 400, statusMessage: 'Hábito pausado ou arquivado não pode receber check-in.' })
    }
    if (!isHabitScheduled(habit.frequency, habit.customDays, today)) {
      throw createError({ statusCode: 400, statusMessage: 'Esse hábito não está previsto para hoje.' })
    }

    const [already] = await tx
      .select()
      .from(checkIns)
      .where(and(eq(checkIns.habitId, id), eq(checkIns.checkinDate, today)))
    if (already) throw createError({ statusCode: 409, statusMessage: 'Check-in de hoje já registrado.' })

    const [user] = await tx.select().from(users).where(eq(users.id, userId))
    if (!user) throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' })

    const skills = await getUnlockedSkillIds(tx, userId)
    const hpRatio = user.hp / HP_MAX

    const newStreak = habit.streakCount + 1
    const alreadyDominated = habit.dominatedAt !== null
    const justDominated = !alreadyDominated && newStreak >= HABIT_DOMINATED_STREAK

    let xpAwarded = justDominated
      ? HABIT_DOMINATED_BONUS_XP
      : alreadyDominated
        ? 0
        : computeCheckinXp(habit.difficulty, newStreak, habit.category, user.playerClass, user.level, skills, hpRatio)

    // Golpe Duplo (Ladino): chance to double a Criatividade check-in's XP.
    let critFired = false
    if (!alreadyDominated && !justDominated && habit.category === 'criatividade') {
      const chance = golpeDuploChance(user.playerClass, user.level, skills)
      if (chance > 0 && Math.random() < chance) {
        xpAwarded *= 2
        critFired = true
      }
    }

    // Tiro Certeiro (Arqueiro): flat bonus every 5th (or 4th) consecutive check-in — tracked as its own event.
    const tiroCerteiroBonus = alreadyDominated ? 0 : tiroCertoBonus(newStreak, habit.difficulty, user.playerClass, user.level, skills)
    xpAwarded += tiroCerteiroBonus

    const goldAwarded = computeCheckinGold(habit.difficulty, habit.category, skills, hpRatio)

    const penitencia = hasSkill(skills, 'paladino_penitencia') && habit.lastBrokenStreakDate === yesterdayStr()
    const newHp = penitencia ? Math.min(HP_MAX, user.hp + 3) : user.hp

    const newXp = user.xp + xpAwarded
    const newGold = user.gold + goldAwarded
    const newLevel = levelForXp(newXp)

    await tx.insert(checkIns).values({
      habitId: habit.id,
      userId,
      checkinDate: today,
      xpAwarded,
      goldAwarded,
      streakAtCheckin: newStreak,
    })

    await tx
      .update(habits)
      .set({
        streakCount: newStreak,
        longestStreak: Math.max(habit.longestStreak, newStreak),
        dominatedAt: justDominated ? new Date().toISOString() : habit.dominatedAt,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(habits.id, habit.id))

    await tx
      .update(users)
      .set({ xp: newXp, level: newLevel, gold: newGold, hp: newHp, updatedAt: new Date().toISOString() })
      .where(eq(users.id, userId))

    const baseXpAwarded = xpAwarded - tiroCerteiroBonus
    if (baseXpAwarded > 0) {
      await tx.insert(xpEvents).values({
        userId,
        habitId: habit.id,
        type: justDominated ? 'ajuste_manual' : critFired ? 'golpe_duplo' : 'checkin',
        amount: baseXpAwarded,
        balanceAfter: newXp,
      })
    }
    if (tiroCerteiroBonus > 0) {
      await tx
        .insert(xpEvents)
        .values({ userId, habitId: habit.id, type: 'tiro_certeiro', amount: tiroCerteiroBonus, balanceAfter: newXp })
    }

    await tx.insert(goldEvents).values({ userId, habitId: habit.id, type: 'checkin', amount: goldAwarded, balanceAfter: newGold })

    if (newHp !== user.hp) {
      await tx
        .insert(hpEvents)
        .values({ userId, habitId: habit.id, type: 'penitencia', amount: newHp - user.hp, hpAfter: newHp })
    }

    return {
      xpAwarded,
      goldAwarded,
      streak: newStreak,
      xp: newXp,
      gold: newGold,
      hp: newHp,
      level: newLevel,
      leveledUp: newLevel > user.level,
      dominated: justDominated,
    }
  })
})

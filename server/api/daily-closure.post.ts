import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { checkIns, dailyClosures, goldEvents, habits, hpEvents, users, xpEvents } from '~~/db/schema'
import {
  HP_MAX,
  HP_REGEN_PERFECT_DAY,
  PERFECT_DAY_GOLD_BONUS,
  PERFECT_DAY_XP_BONUS,
  computeHpLoss,
  computeRelapseXp,
  getRelapseHpRestore,
  levelForXp,
} from '#shared/gamification'
import { hasSkill } from '#shared/skills'
import { isHabitScheduled } from '#shared/habitSchedule'

/**
 * Closes a given day for the logged-in user: applies HP loss for habits missed that day,
 * or the perfect-day HP/XP/gold bonus, then handles relapse (HP === 0) per
 * docs/01-regras-gamificacao.md sections 5 and 11. Idempotent via the daily_closures
 * table — in production this would be invoked by a scheduled job for "yesterday" per
 * user timezone. Gold is never touched by relapse (section 11.6).
 */
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const body = await readBody(event).catch(() => ({}))
  const closureDate: string = body?.date ?? yesterdayStr()

  return db.transaction((tx) => {
    const alreadyProcessed = tx
      .select()
      .from(dailyClosures)
      .where(and(eq(dailyClosures.userId, userId), eq(dailyClosures.closureDate, closureDate)))
      .get()
    if (alreadyProcessed) return alreadyProcessed

    const user = tx.select().from(users).where(eq(users.id, userId)).get()
    if (!user) throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' })

    const skills = getUnlockedSkillIds(tx, userId)

    if (user.restDayDate === closureDate) {
      const gracaEstalagem = hasSkill(skills, 'paladino_graca_estalagem')
      const ultimaCancao = hasSkill(skills, 'bardo_ultima_cancao')
      const restHeal = gracaEstalagem ? 25 : ultimaCancao ? 15 : 0
      const hp = restHeal ? Math.min(HP_MAX, user.hp + restHeal) : user.hp
      tx.update(users)
        .set({ restDayDate: null, hp, updatedAt: new Date().toISOString() })
        .where(eq(users.id, userId))
        .run()
      if (restHeal && hp !== user.hp) {
        tx.insert(hpEvents).values({ userId, type: 'regen_dia_perfeito', amount: hp - user.hp, hpAfter: hp }).run()
      }

      return tx
        .insert(dailyClosures)
        .values({
          userId,
          closureDate,
          perfectDay: false,
          relapsed: false,
          xpChange: 0,
          hpChange: hp - user.hp,
          goldChange: 0,
        })
        .returning()
        .get()
    }

    const activeHabits = tx.select().from(habits).where(and(eq(habits.userId, userId), eq(habits.status, 'ativo'))).all()
    // Only habits that already existed on the closure date, and were actually scheduled for that
    // weekday (dias_customizados), can be "missed" that day.
    const eligibleHabits = activeHabits.filter(
      (h) => h.createdAt.slice(0, 10) <= closureDate && isHabitScheduled(h.frequency, h.customDays, closureDate),
    )

    const missed = eligibleHabits.filter(
      (h) => !tx.select().from(checkIns).where(and(eq(checkIns.habitId, h.id), eq(checkIns.checkinDate, closureDate))).get(),
    )
    const perfectDay = eligibleHabits.length > 0 && missed.length === 0

    // Segunda Voz (Bardo): sequência quebrada vira metade em vez de zero — Social por padrão,
    // qualquer categoria com Refrão.
    for (const habit of missed) {
      const segundaVoz =
        user.playerClass === 'bardo' && user.level >= 5 && (habit.category === 'social' || hasSkill(skills, 'bardo_refrao'))
      const newStreakCount = segundaVoz ? Math.floor(habit.streakCount / 2) : 0
      tx.update(habits)
        .set({
          streakCount: newStreakCount,
          dominatedAt: null,
          lastBrokenStreak: habit.streakCount > 0 ? habit.streakCount : habit.lastBrokenStreak,
          lastBrokenStreakDate: habit.streakCount > 0 ? closureDate : habit.lastBrokenStreakDate,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(habits.id, habit.id))
        .run()
    }

    const totalHpLoss = missed.reduce((sum, h) => sum + computeHpLoss(h.difficulty, user.playerClass, user.level, skills), 0)

    const tudoOuNada = hasSkill(skills, 'guerreiro_tudo_ou_nada')
    // Show Deve Continuar (Bardo, ultimate): dobra o bônus de dia perfeito, no máximo 1x por semana.
    const showDeveContinuarReady =
      hasSkill(skills, 'bardo_show_deve_continuar') &&
      (!user.lastShowMustGoOnDate ||
        new Date(closureDate).getTime() - new Date(user.lastShowMustGoOnDate).getTime() >= 7 * 86400000)
    const showDeveContinuar = perfectDay && showDeveContinuarReady
    const perfectMultiplier = tudoOuNada ? 3 : showDeveContinuar ? 2 : 1
    const perfectXpBonus = perfectDay ? PERFECT_DAY_XP_BONUS * perfectMultiplier : 0
    const perfectGoldBonus = perfectDay ? PERFECT_DAY_GOLD_BONUS * perfectMultiplier : 0

    let hp = perfectDay ? Math.min(HP_MAX, user.hp + HP_REGEN_PERFECT_DAY) : Math.max(0, user.hp - totalHpLoss)
    let xp = perfectDay ? user.xp + perfectXpBonus : user.xp
    const gold = perfectDay ? user.gold + perfectGoldBonus : user.gold
    let level = levelForXp(xp)
    let relapsed = false

    if (hp <= 0) {
      relapsed = true
      const relapseXp = computeRelapseXp(xp)
      const relapseLevel = levelForXp(relapseXp)
      tx.insert(xpEvents)
        .values({ userId, type: 'penalidade_recaida', amount: relapseXp - xp, balanceAfter: relapseXp })
        .run()
      xp = relapseXp
      level = relapseLevel
      hp = getRelapseHpRestore(skills)
      tx.insert(hpEvents).values({ userId, type: 'reset_recaida', amount: hp - user.hp, hpAfter: hp }).run()
    } else {
      tx.insert(hpEvents)
        .values({
          userId,
          type: perfectDay ? 'regen_dia_perfeito' : 'habito_nao_cumprido',
          amount: hp - user.hp,
          hpAfter: hp,
        })
        .run()
    }

    if (perfectDay) {
      tx.insert(xpEvents).values({ userId, type: 'dia_perfeito', amount: perfectXpBonus, balanceAfter: xp }).run()
      tx.insert(goldEvents).values({ userId, type: 'dia_perfeito', amount: perfectGoldBonus, balanceAfter: gold }).run()
    }

    tx.update(users)
      .set({
        xp,
        level,
        hp,
        gold,
        lastShowMustGoOnDate: showDeveContinuar ? closureDate : user.lastShowMustGoOnDate,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId))
      .run()

    const closure = tx
      .insert(dailyClosures)
      .values({
        userId,
        closureDate,
        perfectDay,
        relapsed,
        xpChange: xp - user.xp,
        hpChange: hp - user.hp,
        goldChange: gold - user.gold,
      })
      .returning()
      .get()

    return closure
  })
})

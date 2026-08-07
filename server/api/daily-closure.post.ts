import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { checkIns, dailyClosures, goldEvents, habits, hpEvents, users, xpEvents } from '~~/db/schema'
import { DEMO_USER_ID } from '#shared/constants'
import {
  HP_MAX,
  HP_REGEN_PERFECT_DAY,
  PERFECT_DAY_GOLD_BONUS,
  PERFECT_DAY_XP_BONUS,
  RELAPSE_HP_RESTORE,
  computeHpLoss,
  levelForXp,
  xpForLevel,
} from '#shared/gamification'

/**
 * Closes a given day for the demo user: applies HP loss for habits missed that day,
 * or the perfect-day HP/XP/gold bonus, then handles relapse (HP === 0) per
 * docs/01-regras-gamificacao.md sections 5 and 11. Idempotent via the daily_closures
 * table — in production this would be invoked by a scheduled job for "yesterday" per
 * user timezone. Gold is never touched by relapse (section 11.6).
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const closureDate: string = body?.date ?? yesterdayStr()

  return db.transaction((tx) => {
    const alreadyProcessed = tx
      .select()
      .from(dailyClosures)
      .where(and(eq(dailyClosures.userId, DEMO_USER_ID), eq(dailyClosures.closureDate, closureDate)))
      .get()
    if (alreadyProcessed) return alreadyProcessed

    const user = tx.select().from(users).where(eq(users.id, DEMO_USER_ID)).get()
    if (!user) throw createError({ statusCode: 404, statusMessage: 'Usuário demo não encontrado.' })

    const activeHabits = tx.select().from(habits).where(and(eq(habits.userId, DEMO_USER_ID), eq(habits.status, 'ativo'))).all()
    // Only habits that already existed on the closure date can be "missed" that day.
    const eligibleHabits = activeHabits.filter((h) => h.createdAt.slice(0, 10) <= closureDate)

    const missed = eligibleHabits.filter(
      (h) => !tx.select().from(checkIns).where(and(eq(checkIns.habitId, h.id), eq(checkIns.checkinDate, closureDate))).get(),
    )
    const perfectDay = eligibleHabits.length > 0 && missed.length === 0

    for (const habit of missed) {
      tx.update(habits).set({ streakCount: 0, updatedAt: new Date().toISOString() }).where(eq(habits.id, habit.id)).run()
    }

    const totalHpLoss = missed.reduce((sum, h) => sum + computeHpLoss(h.difficulty, user.playerClass, user.level), 0)

    let hp = perfectDay ? Math.min(HP_MAX, user.hp + HP_REGEN_PERFECT_DAY) : Math.max(0, user.hp - totalHpLoss)
    let xp = perfectDay ? user.xp + PERFECT_DAY_XP_BONUS : user.xp
    const gold = perfectDay ? user.gold + PERFECT_DAY_GOLD_BONUS : user.gold
    let level = levelForXp(xp)
    let relapsed = false

    if (hp <= 0) {
      relapsed = true
      const relapseLevel = Math.max(1, user.level - 1)
      const relapseXp = xpForLevel(relapseLevel)
      tx.insert(xpEvents)
        .values({ userId: DEMO_USER_ID, type: 'penalidade_recaida', amount: relapseXp - xp, balanceAfter: relapseXp })
        .run()
      xp = relapseXp
      level = relapseLevel
      hp = RELAPSE_HP_RESTORE
      tx.insert(hpEvents).values({ userId: DEMO_USER_ID, type: 'reset_recaida', amount: hp - user.hp, hpAfter: hp }).run()
    } else {
      tx.insert(hpEvents)
        .values({
          userId: DEMO_USER_ID,
          type: perfectDay ? 'regen_dia_perfeito' : 'habito_nao_cumprido',
          amount: hp - user.hp,
          hpAfter: hp,
        })
        .run()
    }

    if (perfectDay) {
      tx.insert(xpEvents).values({ userId: DEMO_USER_ID, type: 'dia_perfeito', amount: PERFECT_DAY_XP_BONUS, balanceAfter: xp }).run()
      tx.insert(goldEvents)
        .values({ userId: DEMO_USER_ID, type: 'dia_perfeito', amount: PERFECT_DAY_GOLD_BONUS, balanceAfter: gold })
        .run()
    }

    tx.update(users).set({ xp, level, hp, gold, updatedAt: new Date().toISOString() }).where(eq(users.id, DEMO_USER_ID)).run()

    const closure = tx
      .insert(dailyClosures)
      .values({
        userId: DEMO_USER_ID,
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

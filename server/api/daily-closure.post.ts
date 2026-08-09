import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { checkIns, dailyClosures, goldEvents, habits, hpEvents, shieldUses, users, xpEvents } from '~~/db/schema'
import {
  DIFFICULTY_XP,
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

  return db.transaction(async (tx) => {
    const [alreadyProcessed] = await tx
      .select()
      .from(dailyClosures)
      .where(and(eq(dailyClosures.userId, userId), eq(dailyClosures.closureDate, closureDate)))
    if (alreadyProcessed) return alreadyProcessed

    const [user] = await tx.select().from(users).where(eq(users.id, userId))
    if (!user) throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' })

    const skills = await getUnlockedSkillIds(tx, userId)

    if (user.restDayDate === closureDate) {
      const gracaEstalagem = hasSkill(skills, 'paladino_graca_estalagem')
      const ultimaCancao = hasSkill(skills, 'bardo_ultima_cancao')
      const restHeal = gracaEstalagem ? 25 : ultimaCancao ? 15 : 0
      const hp = restHeal ? Math.min(HP_MAX, user.hp + restHeal) : user.hp
      await tx
        .update(users)
        .set({ restDayDate: null, hp, updatedAt: new Date().toISOString() })
        .where(eq(users.id, userId))
      if (restHeal && hp !== user.hp) {
        await tx.insert(hpEvents).values({ userId, type: 'regen_dia_perfeito', amount: hp - user.hp, hpAfter: hp })
      }

      const [closure] = await tx
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
      return closure
    }

    const activeHabits = await tx.select().from(habits).where(and(eq(habits.userId, userId), eq(habits.status, 'ativo')))
    // Only habits that already existed on the closure date, and were actually scheduled for that
    // weekday (dias_customizados), can be "missed" that day.
    const eligibleHabits = activeHabits.filter(
      (h) => h.createdAt.slice(0, 10) <= closureDate && isHabitScheduled(h.frequency, h.customDays, closureDate),
    )

    const checkedHabitIds = new Set(
      (
        await tx
          .select()
          .from(checkIns)
          .where(and(eq(checkIns.userId, userId), eq(checkIns.checkinDate, closureDate)))
      ).map((c) => c.habitId),
    )
    const missed = eligibleHabits.filter((h) => !checkedHabitIds.has(h.id))
    const perfectDay = eligibleHabits.length > 0 && missed.length === 0

    // Escudo (docs 5.2): reservado via POST /api/user/shield, aplicado aqui no fechamento do dia
    // que ele protege. `protecao_dia` cancela a perda de HP do dia inteiro; `protecao_streak`
    // preserva a sequência de um hábito específico (conta como cumprido, mas sem XP/ouro).
    const [shieldUse] = await tx
      .select()
      .from(shieldUses)
      .where(and(eq(shieldUses.userId, userId), eq(shieldUses.protectedDate, closureDate)))
    const dayShielded = shieldUse?.targetType === 'protecao_dia'
    const protectedHabitId = shieldUse?.targetType === 'protecao_streak' ? shieldUse.habitId : null
    const preservedHabit = protectedHabitId ? missed.find((h) => h.id === protectedHabitId) : undefined
    const punishableMissed = missed.filter((h) => h.id !== protectedHabitId)

    // Segunda Voz (Bardo): sequência quebrada vira metade em vez de zero — Social por padrão,
    // qualquer categoria com Refrão.
    for (const habit of punishableMissed) {
      const segundaVoz =
        user.playerClass === 'bardo' && user.level >= 5 && (habit.category === 'social' || hasSkill(skills, 'bardo_refrao'))
      const newStreakCount = segundaVoz ? Math.floor(habit.streakCount / 2) : 0
      await tx
        .update(habits)
        .set({
          streakCount: newStreakCount,
          dominatedAt: null,
          lastBrokenStreak: habit.streakCount > 0 ? habit.streakCount : habit.lastBrokenStreak,
          lastBrokenStreakDate: habit.streakCount > 0 ? closureDate : habit.lastBrokenStreakDate,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(habits.id, habit.id))
    }

    // Baluarte (Paladino): quando o escudo protege um hábito, credita o XP base dele — igual ao
    // Tiro Certeiro (Arqueiro), um flat da dificuldade, sem multiplicador de streak/classe.
    let baluarteXp = 0
    if (preservedHabit) {
      const newStreakCount = preservedHabit.streakCount + 1
      await tx
        .update(habits)
        .set({
          streakCount: newStreakCount,
          longestStreak: Math.max(preservedHabit.longestStreak, newStreakCount),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(habits.id, preservedHabit.id))

      if (hasSkill(skills, 'paladino_baluarte')) {
        baluarteXp = DIFFICULTY_XP[preservedHabit.difficulty]
      }
    }

    const totalHpLossFromHabits = punishableMissed.reduce(
      (sum, h) => sum + computeHpLoss(h.difficulty, user.playerClass, user.level, skills),
      0,
    )
    const totalHpLoss = dayShielded ? 0 : totalHpLossFromHabits

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
    let xp = (perfectDay ? user.xp + perfectXpBonus : user.xp) + baluarteXp
    const gold = perfectDay ? user.gold + perfectGoldBonus : user.gold
    let level = levelForXp(xp)
    let relapsed = false

    if (hp <= 0) {
      relapsed = true
      const relapseXp = computeRelapseXp(xp)
      const relapseLevel = levelForXp(relapseXp)
      await tx.insert(xpEvents).values({ userId, type: 'penalidade_recaida', amount: relapseXp - xp, balanceAfter: relapseXp })
      xp = relapseXp
      level = relapseLevel
      hp = getRelapseHpRestore(skills)
      await tx.insert(hpEvents).values({ userId, type: 'reset_recaida', amount: hp - user.hp, hpAfter: hp })
    } else {
      const hpEventType = perfectDay
        ? 'regen_dia_perfeito'
        : dayShielded && totalHpLossFromHabits > 0
          ? 'escudo_usado'
          : 'habito_nao_cumprido'
      await tx.insert(hpEvents).values({ userId, type: hpEventType, amount: hp - user.hp, hpAfter: hp })
    }

    if (perfectDay) {
      await tx.insert(xpEvents).values({ userId, type: 'dia_perfeito', amount: perfectXpBonus, balanceAfter: xp })
      await tx.insert(goldEvents).values({ userId, type: 'dia_perfeito', amount: perfectGoldBonus, balanceAfter: gold })
    }
    if (baluarteXp > 0) {
      await tx
        .insert(xpEvents)
        .values({ userId, habitId: preservedHabit!.id, type: 'baluarte', amount: baluarteXp, balanceAfter: xp })
    }

    await tx
      .update(users)
      .set({
        xp,
        level,
        hp,
        gold,
        lastShowMustGoOnDate: showDeveContinuar ? closureDate : user.lastShowMustGoOnDate,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId))

    const [closure] = await tx
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

    return closure
  })
})

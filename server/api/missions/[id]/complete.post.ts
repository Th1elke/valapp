import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { goldEvents, missions, userInventory, users, xpEvents } from '~~/db/schema'
import { levelForXp } from '#shared/gamification'
import { hasSkill } from '#shared/skills'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id é obrigatório.' })

  return db.transaction(async (tx) => {
    const [mission] = await tx.select().from(missions).where(and(eq(missions.id, id), eq(missions.userId, userId)))
    if (!mission) throw createError({ statusCode: 404, statusMessage: 'Missão não encontrada.' })
    if (mission.status !== 'ativa') throw createError({ statusCode: 400, statusMessage: 'Missão não está ativa.' })
    // 'ativa' guarantees difficulty/xpReward/goldReward were set (see difficulty.patch.ts) — standby missions can't reach here.
    const xpReward = mission.xpReward!
    const goldReward = mission.goldReward!

    const [user] = await tx.select().from(users).where(eq(users.id, userId))
    if (!user) throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' })

    const skills = await getUnlockedSkillIds(tx, userId)
    const categoryGoldBonus =
      (mission.category === 'social' && hasSkill(skills, 'bardo_boa_fama')) ||
      (mission.category === 'criatividade' && hasSkill(skills, 'ladino_mao_rapida'))
    const finalGoldReward =
      hasSkill(skills, 'guerreiro_tributo') || categoryGoldBonus ? Math.round(goldReward * 1.5) : goldReward

    const newXp = user.xp + xpReward
    const newGold = user.gold + finalGoldReward
    const newLevel = levelForXp(newXp)

    await tx.update(missions).set({ status: 'concluida', completedAt: new Date().toISOString() }).where(eq(missions.id, mission.id))

    await tx.update(users)
      .set({ xp: newXp, level: newLevel, gold: newGold, updatedAt: new Date().toISOString() })
      .where(eq(users.id, userId))

    await tx.insert(xpEvents).values({ userId: userId, type: 'missao', amount: xpReward, balanceAfter: newXp })
    await tx.insert(goldEvents)
      .values({ userId: userId, missionId: mission.id, type: 'missao', amount: finalGoldReward, balanceAfter: newGold })

    const grantsFreePotion =
      hasSkill(skills, 'guerreiro_mercenario') || (mission.category === 'disciplina' && hasSkill(skills, 'arqueiro_ultima_flecha'))
    if (grantsFreePotion) {
      const [existing] = await tx
        .select()
        .from(userInventory)
        .where(and(eq(userInventory.userId, userId), eq(userInventory.itemId, 'potion_small')))
      if (existing) {
        await tx.update(userInventory)
          .set({ quantity: existing.quantity + 1, updatedAt: new Date().toISOString() })
          .where(eq(userInventory.id, existing.id))
      } else {
        await tx.insert(userInventory).values({ userId: userId, itemId: 'potion_small', quantity: 1 })
      }
    }

    return {
      xpAwarded: xpReward,
      goldAwarded: finalGoldReward,
      xp: newXp,
      gold: newGold,
      level: newLevel,
      leveledUp: newLevel > user.level,
    }
  })
})

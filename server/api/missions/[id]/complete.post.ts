import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { goldEvents, missions, userInventory, users, xpEvents } from '~~/db/schema'
import { levelForXp } from '#shared/gamification'
import { hasSkill } from '#shared/skills'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id é obrigatório.' })

  return db.transaction((tx) => {
    const mission = tx.select().from(missions).where(and(eq(missions.id, id), eq(missions.userId, userId))).get()
    if (!mission) throw createError({ statusCode: 404, statusMessage: 'Missão não encontrada.' })
    if (mission.status !== 'ativa') throw createError({ statusCode: 400, statusMessage: 'Missão já foi concluída ou cancelada.' })

    const user = tx.select().from(users).where(eq(users.id, userId)).get()
    if (!user) throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' })

    const skills = getUnlockedSkillIds(tx, userId)
    const categoryGoldBonus =
      (mission.category === 'social' && hasSkill(skills, 'bardo_boa_fama')) ||
      (mission.category === 'criatividade' && hasSkill(skills, 'ladino_mao_rapida'))
    const goldReward =
      hasSkill(skills, 'guerreiro_tributo') || categoryGoldBonus ? Math.round(mission.goldReward * 1.5) : mission.goldReward

    const newXp = user.xp + mission.xpReward
    const newGold = user.gold + goldReward
    const newLevel = levelForXp(newXp)

    tx.update(missions).set({ status: 'concluida', completedAt: new Date().toISOString() }).where(eq(missions.id, mission.id)).run()

    tx.update(users)
      .set({ xp: newXp, level: newLevel, gold: newGold, updatedAt: new Date().toISOString() })
      .where(eq(users.id, userId))
      .run()

    tx.insert(xpEvents).values({ userId: userId, type: 'missao', amount: mission.xpReward, balanceAfter: newXp }).run()
    tx.insert(goldEvents)
      .values({ userId: userId, missionId: mission.id, type: 'missao', amount: goldReward, balanceAfter: newGold })
      .run()

    const grantsFreePotion =
      hasSkill(skills, 'guerreiro_mercenario') || (mission.category === 'disciplina' && hasSkill(skills, 'arqueiro_ultima_flecha'))
    if (grantsFreePotion) {
      const existing = tx
        .select()
        .from(userInventory)
        .where(and(eq(userInventory.userId, userId), eq(userInventory.itemId, 'potion_small')))
        .get()
      if (existing) {
        tx.update(userInventory)
          .set({ quantity: existing.quantity + 1, updatedAt: new Date().toISOString() })
          .where(eq(userInventory.id, existing.id))
          .run()
      } else {
        tx.insert(userInventory).values({ userId: userId, itemId: 'potion_small', quantity: 1 }).run()
      }
    }

    return { xp: newXp, gold: newGold, level: newLevel, leveledUp: newLevel > user.level }
  })
})

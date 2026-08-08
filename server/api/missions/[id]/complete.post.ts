import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { goldEvents, missions, userInventory, users, xpEvents } from '~~/db/schema'
import { DEMO_USER_ID } from '#shared/constants'
import { levelForXp } from '#shared/gamification'
import { hasSkill } from '#shared/skills'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id é obrigatório.' })

  return db.transaction((tx) => {
    const mission = tx.select().from(missions).where(and(eq(missions.id, id), eq(missions.userId, DEMO_USER_ID))).get()
    if (!mission) throw createError({ statusCode: 404, statusMessage: 'Missão não encontrada.' })
    if (mission.status !== 'ativa') throw createError({ statusCode: 400, statusMessage: 'Missão já foi concluída ou cancelada.' })

    const user = tx.select().from(users).where(eq(users.id, DEMO_USER_ID)).get()
    if (!user) throw createError({ statusCode: 404, statusMessage: 'Usuário demo não encontrado.' })

    const skills = getUnlockedSkillIds(tx, DEMO_USER_ID)
    const goldReward = hasSkill(skills, 'guerreiro_tributo') ? Math.round(mission.goldReward * 1.5) : mission.goldReward

    const newXp = user.xp + mission.xpReward
    const newGold = user.gold + goldReward
    const newLevel = levelForXp(newXp)

    tx.update(missions).set({ status: 'concluida', completedAt: new Date().toISOString() }).where(eq(missions.id, mission.id)).run()

    tx.update(users)
      .set({ xp: newXp, level: newLevel, gold: newGold, updatedAt: new Date().toISOString() })
      .where(eq(users.id, DEMO_USER_ID))
      .run()

    tx.insert(xpEvents).values({ userId: DEMO_USER_ID, type: 'missao', amount: mission.xpReward, balanceAfter: newXp }).run()
    tx.insert(goldEvents)
      .values({ userId: DEMO_USER_ID, missionId: mission.id, type: 'missao', amount: goldReward, balanceAfter: newGold })
      .run()

    if (hasSkill(skills, 'guerreiro_mercenario')) {
      const existing = tx
        .select()
        .from(userInventory)
        .where(and(eq(userInventory.userId, DEMO_USER_ID), eq(userInventory.itemId, 'potion_small')))
        .get()
      if (existing) {
        tx.update(userInventory)
          .set({ quantity: existing.quantity + 1, updatedAt: new Date().toISOString() })
          .where(eq(userInventory.id, existing.id))
          .run()
      } else {
        tx.insert(userInventory).values({ userId: DEMO_USER_ID, itemId: 'potion_small', quantity: 1 }).run()
      }
    }

    return { xp: newXp, gold: newGold, level: newLevel, leveledUp: newLevel > user.level }
  })
})

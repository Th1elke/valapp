import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { goldEvents, missions, users, xpEvents } from '~~/db/schema'
import { DEMO_USER_ID } from '#shared/constants'
import { levelForXp } from '#shared/gamification'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id é obrigatório.' })

  return db.transaction((tx) => {
    const mission = tx.select().from(missions).where(and(eq(missions.id, id), eq(missions.userId, DEMO_USER_ID))).get()
    if (!mission) throw createError({ statusCode: 404, statusMessage: 'Missão não encontrada.' })
    if (mission.status !== 'ativa') throw createError({ statusCode: 400, statusMessage: 'Missão já foi concluída ou cancelada.' })

    const user = tx.select().from(users).where(eq(users.id, DEMO_USER_ID)).get()
    if (!user) throw createError({ statusCode: 404, statusMessage: 'Usuário demo não encontrado.' })

    const newXp = user.xp + mission.xpReward
    const newGold = user.gold + mission.goldReward
    const newLevel = levelForXp(newXp)

    tx.update(missions).set({ status: 'concluida', completedAt: new Date().toISOString() }).where(eq(missions.id, mission.id)).run()

    tx.update(users)
      .set({ xp: newXp, level: newLevel, gold: newGold, updatedAt: new Date().toISOString() })
      .where(eq(users.id, DEMO_USER_ID))
      .run()

    tx.insert(xpEvents).values({ userId: DEMO_USER_ID, type: 'missao', amount: mission.xpReward, balanceAfter: newXp }).run()
    tx.insert(goldEvents)
      .values({ userId: DEMO_USER_ID, missionId: mission.id, type: 'missao', amount: mission.goldReward, balanceAfter: newGold })
      .run()

    return { xp: newXp, gold: newGold, level: newLevel, leveledUp: newLevel > user.level }
  })
})

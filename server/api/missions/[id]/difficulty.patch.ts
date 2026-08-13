import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { habitDifficulties, missions } from '~~/db/schema'
import { missionGoldReward, missionXpReward } from '#shared/gamification'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id é obrigatório.' })

  const body = await readBody(event)
  if (!habitDifficulties.includes(body?.difficulty)) {
    throw createError({ statusCode: 400, statusMessage: 'Dificuldade inválida.' })
  }

  const [mission] = await db.select().from(missions).where(and(eq(missions.id, id), eq(missions.userId, userId)))
  if (!mission) throw createError({ statusCode: 404, statusMessage: 'Missão não encontrada.' })
  if (mission.status !== 'standby') {
    throw createError({ statusCode: 400, statusMessage: 'Só é possível definir a dificuldade de uma missão pendente.' })
  }

  const [updated] = await db
    .update(missions)
    .set({
      difficulty: body.difficulty,
      xpReward: missionXpReward(body.difficulty),
      goldReward: missionGoldReward(body.difficulty),
      status: 'ativa',
    })
    .where(and(eq(missions.id, id), eq(missions.userId, userId)))
    .returning()

  return updated
})

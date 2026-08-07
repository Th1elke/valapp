import { db } from '~~/db/client'
import { habitDifficulties, missions } from '~~/db/schema'
import { DEMO_USER_ID } from '#shared/constants'
import { missionGoldReward, missionXpReward } from '#shared/gamification'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (typeof body?.title !== 'string' || !body.title.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Título da missão é obrigatório.' })
  }
  if (!habitDifficulties.includes(body.difficulty)) {
    throw createError({ statusCode: 400, statusMessage: 'Dificuldade inválida.' })
  }

  const mission = db
    .insert(missions)
    .values({
      userId: DEMO_USER_ID,
      title: body.title.trim(),
      description: typeof body.description === 'string' && body.description.trim() ? body.description.trim() : null,
      difficulty: body.difficulty,
      xpReward: missionXpReward(body.difficulty),
      goldReward: missionGoldReward(body.difficulty),
    })
    .returning()
    .get()

  return mission
})

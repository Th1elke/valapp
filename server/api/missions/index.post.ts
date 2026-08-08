import { db } from '~~/db/client'
import { habitCategories, habitDifficulties, missions } from '~~/db/schema'
import { missionGoldReward, missionXpReward } from '#shared/gamification'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const body = await readBody(event)
  if (typeof body?.title !== 'string' || !body.title.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Título da missão é obrigatório.' })
  }
  if (!habitDifficulties.includes(body.difficulty)) {
    throw createError({ statusCode: 400, statusMessage: 'Dificuldade inválida.' })
  }
  if (body.category !== undefined && body.category !== null && !habitCategories.includes(body.category)) {
    throw createError({ statusCode: 400, statusMessage: 'Categoria inválida.' })
  }

  let deadline: string | null = null
  if (typeof body.deadline === 'string' && body.deadline.trim()) {
    deadline = body.deadline.trim()
    if (Number.isNaN(Date.parse(deadline))) throw createError({ statusCode: 400, statusMessage: 'Prazo inválido.' })
    if (deadline < todayStr()) throw createError({ statusCode: 400, statusMessage: 'O prazo não pode ser no passado.' })
  }

  const mission = db
    .insert(missions)
    .values({
      userId,
      title: body.title.trim(),
      description: typeof body.description === 'string' && body.description.trim() ? body.description.trim() : null,
      category: body.category ?? null,
      difficulty: body.difficulty,
      xpReward: missionXpReward(body.difficulty),
      goldReward: missionGoldReward(body.difficulty),
      deadline,
    })
    .returning()
    .get()

  return mission
})

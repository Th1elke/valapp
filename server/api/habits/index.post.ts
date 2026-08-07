import { db } from '~~/db/client'
import { habitCategories, habitDifficulties, habits } from '~~/db/schema'
import { DEMO_USER_ID } from '#shared/constants'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (typeof body?.name !== 'string' || !body.name.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Nome do hábito é obrigatório.' })
  }
  if (!habitCategories.includes(body.category)) {
    throw createError({ statusCode: 400, statusMessage: 'Categoria inválida.' })
  }
  if (!habitDifficulties.includes(body.difficulty)) {
    throw createError({ statusCode: 400, statusMessage: 'Dificuldade inválida.' })
  }

  const habit = db
    .insert(habits)
    .values({
      userId: DEMO_USER_ID,
      name: body.name.trim(),
      category: body.category,
      difficulty: body.difficulty,
    })
    .returning()
    .get()

  return habit
})

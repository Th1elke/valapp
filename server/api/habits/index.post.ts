import { db } from '~~/db/client'
import { habitCategories, habitDifficulties, habitFrequencies, habits } from '~~/db/schema'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
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

  const frequency = body.frequency !== undefined ? body.frequency : 'diaria'
  if (!habitFrequencies.includes(frequency)) {
    throw createError({ statusCode: 400, statusMessage: 'Frequência inválida.' })
  }

  let customDays: number[] | null = null
  if (frequency === 'dias_customizados') {
    if (!Array.isArray(body.customDays) || body.customDays.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'Escolha pelo menos um dia da semana.' })
    }
    if (!body.customDays.every((d: unknown) => typeof d === 'number' && Number.isInteger(d) && d >= 0 && d <= 6)) {
      throw createError({ statusCode: 400, statusMessage: 'Dias da semana inválidos.' })
    }
    customDays = [...new Set(body.customDays)].sort((a, b) => a - b)
  }

  const [habit] = await db
    .insert(habits)
    .values({
      userId,
      name: body.name.trim(),
      category: body.category,
      difficulty: body.difficulty,
      frequency,
      customDays,
    })
    .returning()

  return habit
})

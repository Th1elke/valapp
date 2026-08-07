import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { habits, habitStatuses } from '~~/db/schema'
import { DEMO_USER_ID } from '#shared/constants'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id é obrigatório.' })

  const body = await readBody(event)
  if (body?.status !== undefined && !habitStatuses.includes(body.status)) {
    throw createError({ statusCode: 400, statusMessage: 'Status inválido.' })
  }

  const updated = db
    .update(habits)
    .set({
      ...(body?.status ? { status: body.status } : {}),
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(habits.id, id), eq(habits.userId, DEMO_USER_ID)))
    .returning()
    .get()

  if (!updated) throw createError({ statusCode: 404, statusMessage: 'Hábito não encontrado.' })
  return updated
})

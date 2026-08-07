import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { missions } from '~~/db/schema'
import { DEMO_USER_ID } from '#shared/constants'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id é obrigatório.' })

  const updated = db
    .update(missions)
    .set({ status: 'cancelada' })
    .where(and(eq(missions.id, id), eq(missions.userId, DEMO_USER_ID)))
    .returning()
    .get()

  if (!updated) throw createError({ statusCode: 404, statusMessage: 'Missão não encontrada.' })
  return { ok: true }
})

import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { missions } from '~~/db/schema'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id é obrigatório.' })

  const [updated] = await db
    .update(missions)
    .set({ status: 'cancelada' })
    .where(and(eq(missions.id, id), eq(missions.userId, userId)))
    .returning()

  if (!updated) throw createError({ statusCode: 404, statusMessage: 'Missão não encontrada.' })
  return { ok: true }
})

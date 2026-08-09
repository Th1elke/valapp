import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { habits } from '~~/db/schema'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id é obrigatório.' })

  const [updated] = await db
    .update(habits)
    .set({ status: 'arquivado', updatedAt: new Date().toISOString() })
    .where(and(eq(habits.id, id), eq(habits.userId, userId)))
    .returning()

  if (!updated) throw createError({ statusCode: 404, statusMessage: 'Hábito não encontrado.' })
  return { ok: true }
})

import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { grimoireSessions } from '~~/db/schema'
import type { GrimoireSessionDTO } from '#shared/types'

export default defineEventHandler(async (event): Promise<GrimoireSessionDTO> => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id é obrigatório.' })

  const [session] = await db
    .select()
    .from(grimoireSessions)
    .where(and(eq(grimoireSessions.id, id), eq(grimoireSessions.userId, userId)))
  if (!session) throw createError({ statusCode: 404, statusMessage: 'Sessão não encontrada.' })

  return toSessionDTO(session)
})

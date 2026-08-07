import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { grimoireSessions } from '~~/db/schema'
import { DEMO_USER_ID } from '#shared/constants'
import type { GrimoireSessionDTO } from '#shared/types'

export default defineEventHandler((event): GrimoireSessionDTO => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id é obrigatório.' })

  const session = db
    .select()
    .from(grimoireSessions)
    .where(and(eq(grimoireSessions.id, id), eq(grimoireSessions.userId, DEMO_USER_ID)))
    .get()
  if (!session) throw createError({ statusCode: 404, statusMessage: 'Sessão não encontrada.' })

  return toSessionDTO(session)
})

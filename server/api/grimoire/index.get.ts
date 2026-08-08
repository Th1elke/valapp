import { desc, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { grimoireSessions } from '~~/db/schema'
import type { GrimoireSessionDTO } from '#shared/types'

export default defineEventHandler(async (event): Promise<GrimoireSessionDTO[]> => {
  const userId = await requireUserId(event)
  const rows = db
    .select()
    .from(grimoireSessions)
    .where(eq(grimoireSessions.userId, userId))
    .orderBy(desc(grimoireSessions.createdAt))
    .all()

  return rows.map(toSessionDTO)
})

import { desc, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { grimoireSessions } from '~~/db/schema'
import { DEMO_USER_ID } from '#shared/constants'
import type { GrimoireSessionDTO } from '#shared/types'

export default defineEventHandler((): GrimoireSessionDTO[] => {
  const rows = db
    .select()
    .from(grimoireSessions)
    .where(eq(grimoireSessions.userId, DEMO_USER_ID))
    .orderBy(desc(grimoireSessions.createdAt))
    .all()

  return rows.map(toSessionDTO)
})

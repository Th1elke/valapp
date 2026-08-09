import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { missions } from '~~/db/schema'
import type { MissionDTO } from '#shared/types'

export default defineEventHandler(async (event): Promise<MissionDTO[]> => {
  const userId = await requireUserId(event)
  const rows = await db
    .select()
    .from(missions)
    .where(and(eq(missions.userId, userId), eq(missions.status, 'ativa')))

  return rows.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    category: m.category,
    difficulty: m.difficulty,
    xpReward: m.xpReward,
    goldReward: m.goldReward,
    status: m.status,
    deadline: m.deadline,
    createdAt: m.createdAt,
  }))
})

import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { missions } from '~~/db/schema'
import { DEMO_USER_ID } from '#shared/constants'
import type { MissionDTO } from '#shared/types'

export default defineEventHandler((): MissionDTO[] => {
  const rows = db
    .select()
    .from(missions)
    .where(and(eq(missions.userId, DEMO_USER_ID), eq(missions.status, 'ativa')))
    .all()

  return rows.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    difficulty: m.difficulty,
    xpReward: m.xpReward,
    goldReward: m.goldReward,
    status: m.status,
    createdAt: m.createdAt,
  }))
})

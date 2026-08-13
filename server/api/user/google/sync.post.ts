import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { missions, users } from '~~/db/schema'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const items = await syncClassroomCourseWork(userId)

  const existing = await db
    .select({ externalId: missions.externalId })
    .from(missions)
    .where(and(eq(missions.userId, userId), eq(missions.source, 'google_classroom')))
  const known = new Set(existing.map((r) => r.externalId))
  const toInsert = items.filter((i) => !known.has(i.externalId))

  if (toInsert.length) {
    await db.insert(missions).values(
      toInsert.map((i) => ({
        userId,
        title: i.title,
        description: i.description,
        category: null,
        difficulty: null,
        xpReward: null,
        goldReward: null,
        status: 'standby' as const,
        deadline: i.deadline,
        source: 'google_classroom',
        externalId: i.externalId,
      })),
    )
  }

  await db.update(users).set({ lastClassroomSyncAt: new Date().toISOString() }).where(eq(users.id, userId))

  return { imported: toInsert.length, skipped: items.length - toInsert.length }
})

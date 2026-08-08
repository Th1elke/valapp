import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { userCosmetics, users } from '~~/db/schema'
import { COSMETIC_ITEMS, type CosmeticCategory } from '#shared/cosmetics'
import { DEMO_USER_ID } from '#shared/constants'
import type { UserStateDTO } from '#shared/types'

const CATEGORY_COLUMN = {
  titulo: 'equippedTitle',
  borda: 'equippedAvatarBorder',
  tema: 'equippedTheme',
} as const satisfies Record<CosmeticCategory, keyof typeof users.$inferInsert>

export default defineEventHandler(async (event): Promise<UserStateDTO> => {
  const body = await readBody(event)
  const category = body?.category as CosmeticCategory | undefined
  const cosmeticId = body?.cosmeticId === null ? null : typeof body?.cosmeticId === 'string' ? body.cosmeticId : undefined

  if (!category || !(category in CATEGORY_COLUMN) || cosmeticId === undefined) {
    throw createError({ statusCode: 400, statusMessage: 'category e cosmeticId são obrigatórios.' })
  }

  return db.transaction((tx): UserStateDTO => {
    if (cosmeticId !== null) {
      const catalogEntry = COSMETIC_ITEMS.find((c) => c.id === cosmeticId && c.category === category)
      if (!catalogEntry) throw createError({ statusCode: 400, statusMessage: 'Cosmético inválido para essa categoria.' })

      const owned = tx
        .select()
        .from(userCosmetics)
        .where(and(eq(userCosmetics.userId, DEMO_USER_ID), eq(userCosmetics.cosmeticId, cosmeticId)))
        .get()
      if (!owned) throw createError({ statusCode: 400, statusMessage: 'Você não possui esse cosmético.' })
    }

    tx.update(users)
      .set({ [CATEGORY_COLUMN[category]]: cosmeticId, updatedAt: new Date().toISOString() })
      .where(eq(users.id, DEMO_USER_ID))
      .run()

    const updated = tx.select().from(users).where(eq(users.id, DEMO_USER_ID)).get()!
    return toUserStateDTO(updated, tx)
  })
})

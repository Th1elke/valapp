import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { playerClasses, userInventory, userSkills, users } from '~~/db/schema'
import { HP_MAX } from '#shared/gamification'
import { INVENTORY_ITEM_IDS, type InventoryItemId } from '#shared/economy'
import { getSkill } from '#shared/skills'
import type { UserStateDTO } from '#shared/types'

/**
 * Debug-only endpoint to force the logged-in user's stats/skills/inventory to any value for
 * manual testing of gameplay formulas — bypasses every normal validation (SP cost, tier
 * order, class match) on purpose. Never available outside `nuxt dev`.
 */
export default defineEventHandler(async (event): Promise<UserStateDTO> => {
  if (!import.meta.dev) {
    throw createError({ statusCode: 403, statusMessage: 'Painel de teste só está disponível em desenvolvimento.' })
  }

  const userId = await requireUserId(event)
  const body = await readBody(event)

  return db.transaction((tx): UserStateDTO => {
    const user = tx.select().from(users).where(eq(users.id, userId)).get()
    if (!user) throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' })

    const updates: Partial<typeof users.$inferInsert> = { updatedAt: new Date().toISOString() }
    if (typeof body.xp === 'number') updates.xp = Math.max(0, Math.round(body.xp))
    if (typeof body.level === 'number') updates.level = Math.max(1, Math.round(body.level))
    if (typeof body.hp === 'number') updates.hp = Math.min(HP_MAX, Math.max(0, Math.round(body.hp)))
    if (typeof body.gold === 'number') updates.gold = Math.max(0, Math.round(body.gold))
    if (typeof body.shieldsRemaining === 'number') updates.shieldsRemaining = Math.max(0, Math.round(body.shieldsRemaining))
    if (body.playerClass === null || playerClasses.includes(body.playerClass)) {
      updates.playerClass = body.playerClass
      updates.classChosenAt = body.playerClass ? (user.classChosenAt ?? new Date().toISOString()) : null
    }
    if (Object.keys(updates).length > 1) {
      tx.update(users).set(updates).where(eq(users.id, userId)).run()
    }

    if (Array.isArray(body.setSkills)) {
      tx.delete(userSkills).where(eq(userSkills.userId, userId)).run()
      for (const skillId of body.setSkills) {
        if (typeof skillId === 'string' && getSkill(skillId)) {
          tx.insert(userSkills).values({ userId, skillId }).run()
        }
      }
    }

    if (body.inventory && typeof body.inventory === 'object') {
      for (const itemId of INVENTORY_ITEM_IDS) {
        const raw = (body.inventory as Record<string, unknown>)[itemId]
        if (typeof raw !== 'number') continue
        const quantity = Math.max(0, Math.round(raw))
        const existing = tx
          .select()
          .from(userInventory)
          .where(and(eq(userInventory.userId, userId), eq(userInventory.itemId, itemId as InventoryItemId)))
          .get()
        if (existing) {
          tx.update(userInventory).set({ quantity, updatedAt: new Date().toISOString() }).where(eq(userInventory.id, existing.id)).run()
        } else if (quantity > 0) {
          tx.insert(userInventory).values({ userId, itemId: itemId as InventoryItemId, quantity }).run()
        }
      }
    }

    const updated = tx.select().from(users).where(eq(users.id, userId)).get()!
    return toUserStateDTO(updated, tx)
  })
})

import { eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { goldEvents, hpEvents, users } from '~~/db/schema'
import { MAX_SHIELDS, POTION_HEAL_AMOUNT, SHOP_ITEMS } from '#shared/economy'
import { DEMO_USER_ID } from '#shared/constants'
import { HP_MAX, xpForLevel } from '#shared/gamification'
import type { UserStateDTO } from '#shared/types'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const item = SHOP_ITEMS.find((i) => i.id === body?.itemId)
  if (!item) throw createError({ statusCode: 400, statusMessage: 'Item inválido.' })

  return db.transaction((tx): UserStateDTO => {
    const user = tx.select().from(users).where(eq(users.id, DEMO_USER_ID)).get()
    if (!user) throw createError({ statusCode: 404, statusMessage: 'Usuário demo não encontrado.' })
    if (user.gold < item.cost) throw createError({ statusCode: 400, statusMessage: 'Ouro insuficiente.' })
    if (item.id === 'shield' && user.shieldsRemaining >= MAX_SHIELDS) {
      throw createError({ statusCode: 400, statusMessage: `Você já tem o máximo de ${MAX_SHIELDS} escudos.` })
    }

    const newGold = user.gold - item.cost
    const updates: Partial<typeof users.$inferInsert> = { gold: newGold, updatedAt: new Date().toISOString() }

    if (item.id === 'potion') {
      const newHp = Math.min(HP_MAX, user.hp + POTION_HEAL_AMOUNT)
      updates.hp = newHp
      tx.insert(hpEvents).values({ userId: DEMO_USER_ID, type: 'pocao_cura', amount: newHp - user.hp, hpAfter: newHp }).run()
    } else {
      updates.shieldsRemaining = user.shieldsRemaining + 1
    }

    tx.update(users).set(updates).where(eq(users.id, DEMO_USER_ID)).run()

    tx.insert(goldEvents).values({ userId: DEMO_USER_ID, type: 'compra', amount: -item.cost, balanceAfter: newGold }).run()

    const updated = tx.select().from(users).where(eq(users.id, DEMO_USER_ID)).get()!
    return {
      name: updated.name,
      level: updated.level,
      xp: updated.xp,
      hp: updated.hp,
      gold: updated.gold,
      playerClass: updated.playerClass,
      shieldsRemaining: updated.shieldsRemaining,
      xpFloor: xpForLevel(updated.level),
      xpCeil: xpForLevel(updated.level + 1),
    }
  })
})

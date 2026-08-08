import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { checkIns, goldEvents, habits, userCosmetics, userInventory, users } from '~~/db/schema'
import { getEffectiveCost, getMaxShields, SHOP_ITEMS } from '#shared/economy'
import { COSMETIC_ITEMS } from '#shared/cosmetics'
import { DEMO_USER_ID } from '#shared/constants'
import type { UserStateDTO } from '#shared/types'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const itemId = body?.itemId
  const item = SHOP_ITEMS.find((i) => i.id === itemId)
  const cosmetic = !item ? COSMETIC_ITEMS.find((c) => c.id === itemId) : undefined
  if (!item && !cosmetic) throw createError({ statusCode: 400, statusMessage: 'Item inválido.' })
  const targetHabitId = typeof body?.targetHabitId === 'string' ? body.targetHabitId : null

  if (cosmetic) {
    return db.transaction((tx): UserStateDTO => {
      const user = tx.select().from(users).where(eq(users.id, DEMO_USER_ID)).get()
      if (!user) throw createError({ statusCode: 404, statusMessage: 'Usuário demo não encontrado.' })
      if (user.gold < cosmetic.cost) throw createError({ statusCode: 400, statusMessage: 'Ouro insuficiente.' })

      const alreadyOwned = tx
        .select()
        .from(userCosmetics)
        .where(and(eq(userCosmetics.userId, DEMO_USER_ID), eq(userCosmetics.cosmeticId, cosmetic.id)))
        .get()
      if (alreadyOwned) throw createError({ statusCode: 400, statusMessage: 'Você já possui esse cosmético.' })

      const newGold = user.gold - cosmetic.cost
      tx.insert(userCosmetics).values({ userId: DEMO_USER_ID, cosmeticId: cosmetic.id }).run()
      tx.update(users).set({ gold: newGold, updatedAt: new Date().toISOString() }).where(eq(users.id, DEMO_USER_ID)).run()
      tx.insert(goldEvents).values({ userId: DEMO_USER_ID, type: 'compra', amount: -cosmetic.cost, balanceAfter: newGold }).run()

      const updated = tx.select().from(users).where(eq(users.id, DEMO_USER_ID)).get()!
      return toUserStateDTO(updated, tx)
    })
  }

  return db.transaction((tx): UserStateDTO => {
    const user = tx.select().from(users).where(eq(users.id, DEMO_USER_ID)).get()
    if (!user) throw createError({ statusCode: 404, statusMessage: 'Usuário demo não encontrado.' })

    const skills = getUnlockedSkillIds(tx, DEMO_USER_ID)
    const maxShields = getMaxShields(skills)
    const cost = getEffectiveCost(item!, skills)

    if (user.gold < cost) throw createError({ statusCode: 400, statusMessage: 'Ouro insuficiente.' })
    if (item!.effect.kind === 'shield' && user.shieldsRemaining >= maxShields) {
      throw createError({ statusCode: 400, statusMessage: `Você já tem o máximo de ${maxShields} escudos.` })
    }
    if (item!.effect.kind === 'rest_day' && user.restDayDate) {
      throw createError({ statusCode: 400, statusMessage: 'Você já tem um Ticket da Estalagem ativo.' })
    }

    const newGold = user.gold - cost
    const updates: Partial<typeof users.$inferInsert> = { gold: newGold, updatedAt: new Date().toISOString() }

    switch (item!.effect.kind) {
      case 'shield': {
        updates.shieldsRemaining = user.shieldsRemaining + 1
        break
      }
      case 'inventory': {
        const existing = tx
          .select()
          .from(userInventory)
          .where(and(eq(userInventory.userId, DEMO_USER_ID), eq(userInventory.itemId, item!.effect.itemId)))
          .get()
        if (existing) {
          tx.update(userInventory)
            .set({ quantity: existing.quantity + item!.effect.grants, updatedAt: new Date().toISOString() })
            .where(eq(userInventory.id, existing.id))
            .run()
        } else {
          tx.insert(userInventory)
            .values({ userId: DEMO_USER_ID, itemId: item!.effect.itemId, quantity: item!.effect.grants })
            .run()
        }
        break
      }
      case 'rest_day': {
        updates.restDayDate = todayStr()
        break
      }
      case 'streak_restore': {
        if (!targetHabitId) throw createError({ statusCode: 400, statusMessage: 'targetHabitId é obrigatório.' })
        const habit = tx.select().from(habits).where(and(eq(habits.id, targetHabitId), eq(habits.userId, DEMO_USER_ID))).get()
        if (!habit) throw createError({ statusCode: 404, statusMessage: 'Hábito não encontrado.' })
        if (habit.lastBrokenStreak == null || !habit.lastBrokenStreakDate) {
          throw createError({ statusCode: 400, statusMessage: 'Esse hábito não tem uma sequência recente para restaurar.' })
        }

        tx.update(habits)
          .set({
            streakCount: habit.lastBrokenStreak,
            longestStreak: Math.max(habit.longestStreak, habit.lastBrokenStreak),
            lastBrokenStreak: null,
            lastBrokenStreakDate: null,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(habits.id, habit.id))
          .run()

        const existingCheckin = tx
          .select()
          .from(checkIns)
          .where(and(eq(checkIns.habitId, habit.id), eq(checkIns.checkinDate, habit.lastBrokenStreakDate)))
          .get()
        if (!existingCheckin) {
          tx.insert(checkIns)
            .values({
              habitId: habit.id,
              userId: DEMO_USER_ID,
              checkinDate: habit.lastBrokenStreakDate,
              xpAwarded: 0,
              goldAwarded: 0,
              streakAtCheckin: habit.lastBrokenStreak,
            })
            .run()
        }
        break
      }
    }

    tx.update(users).set(updates).where(eq(users.id, DEMO_USER_ID)).run()

    tx.insert(goldEvents).values({ userId: DEMO_USER_ID, type: 'compra', amount: -cost, balanceAfter: newGold }).run()

    const updated = tx.select().from(users).where(eq(users.id, DEMO_USER_ID)).get()!
    return toUserStateDTO(updated, tx)
  })
})

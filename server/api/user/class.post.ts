import { eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { classChanges, playerClasses, users, xpEvents } from '~~/db/schema'
import { CLASS_CHANGE_COOLDOWN_DAYS, CLASS_CHANGE_XP_COST_PERCENT, levelForXp } from '#shared/gamification'
import type { UserStateDTO } from '#shared/types'

export default defineEventHandler(async (event): Promise<UserStateDTO> => {
  const userId = await requireUserId(event)
  const body = await readBody(event)
  if (!playerClasses.includes(body?.playerClass)) {
    throw createError({ statusCode: 400, statusMessage: 'Classe inválida.' })
  }

  return db.transaction(async (tx): Promise<UserStateDTO> => {
    const [user] = await tx.select().from(users).where(eq(users.id, userId))
    if (!user) throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' })
    if (user.level < 5) {
      throw createError({ statusCode: 400, statusMessage: 'Só é possível escolher uma classe a partir do nível 5.' })
    }

    // Escolha inicial (nível 5, sem custo nem cooldown — ver docs seção 4).
    if (!user.playerClass) {
      const [updated] = await tx
        .update(users)
        .set({ playerClass: body.playerClass, classChosenAt: new Date().toISOString() })
        .where(eq(users.id, userId))
        .returning()
      return await toUserStateDTO(updated!, tx)
    }

    // Troca de classe (docs seção 4.3): 1x a cada 90 dias, custando 30% do XP atual.
    if (body.playerClass === user.playerClass) {
      throw createError({ statusCode: 400, statusMessage: 'Você já é dessa classe.' })
    }
    const lastChange = user.lastClassChangeAt ?? user.classChosenAt
    if (lastChange) {
      const daysSince = (Date.now() - new Date(lastChange).getTime()) / 86400000
      if (daysSince < CLASS_CHANGE_COOLDOWN_DAYS) {
        const daysLeft = Math.ceil(CLASS_CHANGE_COOLDOWN_DAYS - daysSince)
        throw createError({ statusCode: 400, statusMessage: `Só é possível trocar de classe novamente em ${daysLeft} dia(s).` })
      }
    }

    const xpCost = Math.round(user.xp * CLASS_CHANGE_XP_COST_PERCENT)
    const newXp = Math.max(0, user.xp - xpCost)
    const newLevel = levelForXp(newXp)
    const now = new Date().toISOString()

    await tx.insert(classChanges).values({ userId, oldClass: user.playerClass, newClass: body.playerClass, xpCost })
    await tx.insert(xpEvents).values({ userId, type: 'custo_troca_classe', amount: -xpCost, balanceAfter: newXp })

    const [updated] = await tx
      .update(users)
      .set({ playerClass: body.playerClass, xp: newXp, level: newLevel, lastClassChangeAt: now, updatedAt: now })
      .where(eq(users.id, userId))
      .returning()

    return await toUserStateDTO(updated!, tx)
  })
})

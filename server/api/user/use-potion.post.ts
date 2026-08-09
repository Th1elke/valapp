import { eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { hpEvents, users } from '~~/db/schema'
import { POTION_HEAL_AMOUNTS, getPotionHealAmount, type PotionItemId } from '#shared/economy'
import { HP_MAX } from '#shared/gamification'
import type { UserStateDTO } from '#shared/types'

export default defineEventHandler(async (event): Promise<UserStateDTO> => {
  const userId = await requireUserId(event)
  const body = await readBody(event)
  const itemId = body?.itemId as PotionItemId
  if (!POTION_HEAL_AMOUNTS[itemId]) throw createError({ statusCode: 400, statusMessage: 'Poção inválida.' })

  return db.transaction(async (tx): Promise<UserStateDTO> => {
    const [user] = await tx.select().from(users).where(eq(users.id, userId))
    if (!user) throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' })

    const skills = await getUnlockedSkillIds(tx, userId)
    const { hadItem } = await consumeInventoryItem(tx, userId, itemId, skills)
    if (!hadItem) throw createError({ statusCode: 400, statusMessage: 'Você não tem essa poção.' })

    const healAmount = getPotionHealAmount(itemId, skills)
    const newHp = Math.min(HP_MAX, user.hp + healAmount)

    await tx.update(users).set({ hp: newHp, updatedAt: new Date().toISOString() }).where(eq(users.id, userId))
    await tx.insert(hpEvents).values({ userId, type: 'pocao_cura', amount: newHp - user.hp, hpAfter: newHp })

    const [updated] = await tx.select().from(users).where(eq(users.id, userId))
    return await toUserStateDTO(updated!, tx)
  })
})

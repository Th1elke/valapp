import { eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { userCosmetics, userInventory, userSkills, type users } from '~~/db/schema'
import { getAvailableSP, xpForLevel } from '#shared/gamification'
import type { InventoryItemId } from '#shared/economy'
import type { UserStateDTO } from '#shared/types'

type Queryable = Pick<typeof db, 'select'>

export async function toUserStateDTO(user: typeof users.$inferSelect, tx: Queryable = db): Promise<UserStateDTO> {
  const rows = await tx.select().from(userInventory).where(eq(userInventory.userId, user.id))
  const inventory: Partial<Record<InventoryItemId, number>> = {}
  for (const row of rows) {
    if (row.quantity > 0) inventory[row.itemId] = row.quantity
  }

  const ownedCosmeticsRows = await tx.select().from(userCosmetics).where(eq(userCosmetics.userId, user.id))
  const ownedCosmetics = ownedCosmeticsRows.map((row) => row.cosmeticId)

  const unlockedSkillsRows = await tx.select().from(userSkills).where(eq(userSkills.userId, user.id))
  const unlockedSkills = unlockedSkillsRows.map((row) => row.skillId)

  return {
    name: user.name,
    level: user.level,
    xp: user.xp,
    hp: user.hp,
    gold: user.gold,
    playerClass: user.playerClass,
    classChosenAt: user.classChosenAt,
    lastClassChangeAt: user.lastClassChangeAt,
    shieldsRemaining: user.shieldsRemaining,
    xpFloor: xpForLevel(user.level),
    xpCeil: xpForLevel(user.level + 1),
    inventory,
    restDayDate: user.restDayDate,
    equippedTitle: user.equippedTitle,
    equippedAvatarBorder: user.equippedAvatarBorder,
    equippedTheme: user.equippedTheme,
    ownedCosmetics,
    avatarUrl: user.avatarUrl,
    coverUrl: user.coverUrl,
    unlockedSkills,
    availableSkillPoints: getAvailableSP(user.level, unlockedSkills.length),
    googleLinked: user.googleRefreshToken !== null,
    googleEmail: user.googleEmail,
    lastClassroomSyncAt: user.lastClassroomSyncAt,
  }
}

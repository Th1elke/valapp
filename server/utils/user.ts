import { eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { userCosmetics, userInventory, userSkills, type users } from '~~/db/schema'
import { getAvailableSP, xpForLevel } from '#shared/gamification'
import type { InventoryItemId } from '#shared/economy'
import type { UserStateDTO } from '#shared/types'

type Queryable = Pick<typeof db, 'select'>

export function toUserStateDTO(user: typeof users.$inferSelect, tx: Queryable = db): UserStateDTO {
  const rows = tx.select().from(userInventory).where(eq(userInventory.userId, user.id)).all()
  const inventory: Partial<Record<InventoryItemId, number>> = {}
  for (const row of rows) {
    if (row.quantity > 0) inventory[row.itemId] = row.quantity
  }

  const ownedCosmetics = tx
    .select()
    .from(userCosmetics)
    .where(eq(userCosmetics.userId, user.id))
    .all()
    .map((row) => row.cosmeticId)

  const unlockedSkills = tx
    .select()
    .from(userSkills)
    .where(eq(userSkills.userId, user.id))
    .all()
    .map((row) => row.skillId)

  return {
    name: user.name,
    level: user.level,
    xp: user.xp,
    hp: user.hp,
    gold: user.gold,
    playerClass: user.playerClass,
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
  }
}

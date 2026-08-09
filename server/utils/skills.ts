import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { userInventory, userSkills } from '~~/db/schema'
import { hasSkill } from '#shared/skills'
import type { InventoryItemId } from '#shared/economy'

type Queryable = Pick<typeof db, 'select'>
type Writable = Queryable & Pick<typeof db, 'update'>

export async function getUnlockedSkillIds(tx: Queryable, userId: string): Promise<string[]> {
  const rows = await tx.select().from(userSkills).where(eq(userSkills.userId, userId))
  return rows.map((row) => row.skillId)
}

/**
 * Decrements 1 unit of an inventory item, unless Transmutação (Mago) rolls a 15% save.
 * Returns `hadItem: false` if the user didn't own any — callers should treat that as "can't use".
 */
export async function consumeInventoryItem(
  tx: Writable,
  userId: string,
  itemId: InventoryItemId,
  skills: readonly string[],
): Promise<{ hadItem: boolean; consumed: boolean }> {
  const [row] = await tx
    .select()
    .from(userInventory)
    .where(and(eq(userInventory.userId, userId), eq(userInventory.itemId, itemId)))
  if (!row || row.quantity <= 0) return { hadItem: false, consumed: false }

  const sparedByTransmutacao = hasSkill(skills, 'mago_transmutacao') && Math.random() < 0.15
  if (!sparedByTransmutacao) {
    await tx
      .update(userInventory)
      .set({ quantity: row.quantity - 1, updatedAt: new Date().toISOString() })
      .where(eq(userInventory.id, row.id))
  }
  return { hadItem: true, consumed: !sparedByTransmutacao }
}

import type { PotionItemId, ShopItemId } from '#shared/economy'
import type { UserStateDTO } from '#shared/types'

export function purchaseItem(itemId: ShopItemId, opts?: { targetHabitId?: string }) {
  return $fetch<UserStateDTO>('/api/shop/purchase', { method: 'POST', body: { itemId, targetHabitId: opts?.targetHabitId } })
}

export function purchaseCosmetic(cosmeticId: string) {
  return $fetch<UserStateDTO>('/api/shop/purchase', { method: 'POST', body: { itemId: cosmeticId } })
}

export function usePotion(itemId: PotionItemId) {
  return $fetch<UserStateDTO>('/api/user/use-potion', { method: 'POST', body: { itemId } })
}

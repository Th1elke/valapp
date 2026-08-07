import type { ShopItemId } from '#shared/economy'
import type { UserStateDTO } from '#shared/types'

export function purchaseItem(itemId: ShopItemId) {
  return $fetch<UserStateDTO>('/api/shop/purchase', { method: 'POST', body: { itemId } })
}

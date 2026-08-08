import type { CosmeticCategory } from '#shared/cosmetics'
import type { UserStateDTO } from '#shared/types'

export function equipCosmetic(category: CosmeticCategory, cosmeticId: string | null) {
  return $fetch<UserStateDTO>('/api/cosmetics/equip', { method: 'POST', body: { category, cosmeticId } })
}

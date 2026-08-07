export type ShopItemId = 'potion' | 'shield'

export interface ShopItem {
  id: ShopItemId
  name: string
  description: string
  cost: number
}

export const POTION_HEAL_AMOUNT = 20
export const MAX_SHIELDS = 3

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'potion', name: 'Poção de Cura', description: `Restaura ${POTION_HEAL_AMOUNT} HP na hora (teto 100)`, cost: 50 },
  { id: 'shield', name: 'Escudo Extra', description: `+1 escudo disponível, até um máximo de ${MAX_SHIELDS}`, cost: 80 },
]

import { hasSkill } from './skills'

export type PotionItemId = 'potion_small' | 'potion_medium' | 'potion_large'
export type InventoryItemId = PotionItemId | 'olho_visao' | 'escudo_cristal' | 'elixir_erudito' | 'pena_magica'

/** Grimório battle consumables discounted by Barganha Arcana (Mago) — Pena Mágica is deliberately excluded, per balanceamento.txt. */
const BARGANHA_ARCANA_ITEMS: ReadonlySet<InventoryItemId> = new Set(['olho_visao', 'escudo_cristal', 'elixir_erudito'])

export type ShopItemId = 'shield' | InventoryItemId | 'ampulheta_tempo' | 'ticket_estalagem'

export type ShopEffect =
  | { kind: 'shield' }
  | { kind: 'inventory'; itemId: InventoryItemId; grants: number }
  | { kind: 'streak_restore' }
  | { kind: 'rest_day' }

export interface ShopItem {
  id: ShopItemId
  name: string
  description: string
  cost: number
  effect: ShopEffect
}

export const MAX_SHIELDS = 3

/** Shield cap — raised to 5 by Armadura Reforçada (Paladino). */
export function getMaxShields(skills: readonly string[] = []): number {
  return hasSkill(skills, 'paladino_armadura_reforcada') ? 5 : MAX_SHIELDS
}

export const POTION_HEAL_AMOUNTS: Record<PotionItemId, number> = {
  potion_small: 20,
  potion_medium: 50,
  potion_large: 100,
}

/** Potion heal amount — boosted 25% by Metabolismo Mágico (Mago). */
export function getPotionHealAmount(itemId: PotionItemId, skills: readonly string[] = []): number {
  const base = POTION_HEAL_AMOUNTS[itemId]
  return hasSkill(skills, 'mago_metabolismo_magico') ? Math.round(base * 1.25) : base
}

/** Shop price for an item — Barganha Arcana (Mago) discounts a few Grimório consumables by 20%. */
export function getEffectiveCost(item: Pick<ShopItem, 'cost' | 'effect'>, skills: readonly string[] = []): number {
  if (
    item.effect.kind === 'inventory' &&
    BARGANHA_ARCANA_ITEMS.has(item.effect.itemId) &&
    hasSkill(skills, 'mago_barganha_arcana')
  ) {
    return Math.round(item.cost * 0.8)
  }
  return item.cost
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'potion_small',
    name: 'Poção de Vida — Pequena',
    description: 'Guarda no inventário; use quando quiser para restaurar 20 HP (teto 100)',
    cost: 50,
    effect: { kind: 'inventory', itemId: 'potion_small', grants: 1 },
  },
  {
    id: 'potion_medium',
    name: 'Poção de Vida — Média',
    description: 'Guarda no inventário; use quando quiser para restaurar 50 HP (teto 100)',
    cost: 110,
    effect: { kind: 'inventory', itemId: 'potion_medium', grants: 1 },
  },
  {
    id: 'potion_large',
    name: 'Poção de Vida — Grande',
    description: 'Guarda no inventário; use quando quiser para restaurar 100 HP (teto 100)',
    cost: 200,
    effect: { kind: 'inventory', itemId: 'potion_large', grants: 1 },
  },
  {
    id: 'shield',
    name: 'Escudo Extra',
    description: `+1 escudo disponível, até um máximo de ${MAX_SHIELDS}`,
    cost: 80,
    effect: { kind: 'shield' },
  },
  {
    id: 'olho_visao',
    name: 'Olho da Visão Verdadeira',
    description: 'Na Batalha do Grimório, elimina 2 alternativas erradas da pergunta atual (efeito 50/50)',
    cost: 60,
    effect: { kind: 'inventory', itemId: 'olho_visao', grants: 1 },
  },
  {
    id: 'escudo_cristal',
    name: 'Escudo de Cristal',
    description: 'Se você errar uma pergunta do Grimório, absorve o golpe: sem perda de HP e você tenta de novo',
    cost: 70,
    effect: { kind: 'inventory', itemId: 'escudo_cristal', grants: 1 },
  },
  {
    id: 'elixir_erudito',
    name: 'Elixir do Erudito',
    description: 'Dobra o XP (e a Inteligência) ganho ao derrotar o próximo Chefe de Conhecimento',
    cost: 90,
    effect: { kind: 'inventory', itemId: 'elixir_erudito', grants: 1 },
  },
  {
    id: 'pena_magica',
    name: 'Pena Mágica de Expansão',
    description: 'Permite colar um texto bem maior que o normal no Grimório para gerar um "Super Chefe"',
    cost: 60,
    effect: { kind: 'inventory', itemId: 'pena_magica', grants: 1 },
  },
  {
    id: 'ampulheta_tempo',
    name: 'Ampulheta do Tempo',
    description: 'Restaura a sequência de um hábito que quebrou no último fechamento de dia',
    cost: 400,
    effect: { kind: 'streak_restore' },
  },
  {
    id: 'ticket_estalagem',
    name: 'Ticket da Estalagem',
    description: 'Congela o dano de hoje: sem XP extra, mas também sem perda de HP ou de sequência',
    cost: 120,
    effect: { kind: 'rest_day' },
  },
]

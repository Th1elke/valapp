<script setup lang="ts">
import { Eye, Feather, Gem, Heart, Zap } from 'lucide-vue-next'
import type { InventoryItemId, PotionItemId } from '#shared/economy'
import { POTION_HEAL_AMOUNTS } from '#shared/economy'
import type { UserStateDTO } from '#shared/types'

const props = defineProps<{ inventory: UserStateDTO['inventory'] }>()
const emit = defineEmits<{ used: [] }>()

const SLOT_ITEMS: InventoryItemId[] = [
  'potion_small',
  'potion_medium',
  'potion_large',
  'escudo_cristal',
  'olho_visao',
  'elixir_erudito',
  'pena_magica',
]
const itemIcons: Record<InventoryItemId, typeof Eye> = {
  potion_small: Heart,
  potion_medium: Heart,
  potion_large: Heart,
  olho_visao: Eye,
  escudo_cristal: Gem,
  elixir_erudito: Zap,
  pena_magica: Feather,
}
const itemTitles: Record<InventoryItemId, string> = {
  potion_small: 'Poção de Vida — Pequena (clique para usar)',
  potion_medium: 'Poção de Vida — Média (clique para usar)',
  potion_large: 'Poção de Vida — Grande (clique para usar)',
  olho_visao: 'Olho da Visão Verdadeira — use durante uma Batalha no Grimório',
  escudo_cristal: 'Escudo de Cristal — usado automaticamente ao errar no Grimório',
  elixir_erudito: 'Elixir do Erudito — ative ao iniciar uma Batalha no Grimório',
  pena_magica: 'Pena Mágica — usada automaticamente em textos longos no Grimório',
}

function isPotion(itemId: InventoryItemId): itemId is PotionItemId {
  return itemId in POTION_HEAL_AMOUNTS
}

const sortedSlots = computed(() =>
  [...SLOT_ITEMS].sort((a, b) => (props.inventory[b] ? 1 : 0) - (props.inventory[a] ? 1 : 0)),
)

const usingItem = ref<string | null>(null)

async function onSlotClick(itemId: InventoryItemId) {
  if (!isPotion(itemId) || !props.inventory[itemId] || usingItem.value) return
  usingItem.value = itemId
  try {
    await usePotion(itemId)
    emit('used')
  } finally {
    usingItem.value = null
  }
}

const { el, onPointerDown, onPointerMove, onPointerUp } = useDragScroll('y')
</script>

<template>
  <div
    ref="el"
    class="no-scrollbar grid max-h-72 cursor-grab select-none grid-cols-3 gap-3 overflow-y-auto active:cursor-grabbing sm:grid-cols-4"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointerleave="onPointerUp"
  >
    <button
      v-for="itemId in sortedSlots"
      :key="itemId"
      type="button"
      :title="itemTitles[itemId]"
      :disabled="!isPotion(itemId) || !inventory[itemId] || usingItem === itemId"
      class="relative flex aspect-square items-center justify-center rounded-2xl transition-colors"
      :class="[
        inventory[itemId] ? 'glass-inset' : 'border border-dashed border-white/10',
        isPotion(itemId) && inventory[itemId] ? 'cursor-pointer hover:bg-white/[0.07]' : 'cursor-default',
      ]"
      @click="onSlotClick(itemId)"
    >
      <component :is="itemIcons[itemId]" v-if="inventory[itemId]" :size="26" class="pointer-events-none text-primary" />
      <span
        v-if="inventory[itemId]"
        class="pointer-events-none absolute -bottom-2 -right-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground"
      >
        x{{ inventory[itemId] }}
      </span>
    </button>
  </div>
</template>

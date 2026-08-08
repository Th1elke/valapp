<script setup lang="ts">
import { Music2, Shield, Sword, Target, User, VenetianMask, Wand2 } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { BORDER_STYLES } from '#shared/cosmetics'
import { getClassInfo } from '#shared/gamification'
import type { PlayerClass } from '#shared/types'

const props = withDefaults(
  defineProps<{
    playerClass: PlayerClass | null
    level: number
    size?: 'sm' | 'md' | 'lg'
    borderId?: string | null
    avatarUrl?: string | null
  }>(),
  { size: 'md', borderId: null, avatarUrl: null },
)

const info = computed(() => getClassInfo(props.playerClass, props.level))

const classIcons = { guerreiro: Sword, mago: Wand2, paladino: Shield, arqueiro: Target, ladino: VenetianMask, bardo: Music2 }
const icon = computed(() => (info.value.base ? classIcons[info.value.base] : User))

const avatarSizeClass = computed(() => ({ sm: 'h-10 w-10', md: 'h-16 w-16', lg: 'h-28 w-28' })[props.size])
const iconPx = computed(() => ({ sm: 18, md: 28, lg: 48 })[props.size])

const border = computed(() => (props.borderId && BORDER_STYLES[props.borderId]) || null)
const ringClass = computed(() => (border.value?.kind === 'ring' ? border.value.className : 'ring-2 ring-white/10'))
const gradientBorderClass = computed(() => (border.value?.kind === 'gradient' ? border.value.className : ''))
</script>

<template>
  <div :class="cn('relative shrink-0 rounded-full', avatarSizeClass, gradientBorderClass)">
    <div
      :class="
        cn(
          'flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-br shadow-lg',
          ringClass,
          info.gradient,
        )
      "
    >
      <img v-if="avatarUrl" :src="avatarUrl" alt="" class="h-full w-full object-cover" />
      <component :is="icon" v-else :size="iconPx" class="text-white drop-shadow" />
    </div>
  </div>
</template>

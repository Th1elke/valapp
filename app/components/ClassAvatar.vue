<script setup lang="ts">
import { Shield, Sword, User, Wand2 } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { getClassInfo } from '#shared/gamification'
import type { PlayerClass } from '#shared/types'

const props = withDefaults(
  defineProps<{
    playerClass: PlayerClass | null
    level: number
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { size: 'md' },
)

const info = computed(() => getClassInfo(props.playerClass, props.level))

const classIcons = { guerreiro: Sword, mago: Wand2, paladino: Shield }
const icon = computed(() => (info.value.base ? classIcons[info.value.base] : User))

const avatarSizeClass = computed(() => ({ sm: 'h-10 w-10', md: 'h-16 w-16', lg: 'h-28 w-28' })[props.size])
const iconPx = computed(() => ({ sm: 18, md: 28, lg: 48 })[props.size])
</script>

<template>
  <div
    :class="
      cn(
        'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br shadow-lg ring-2 ring-white/10',
        avatarSizeClass,
        info.gradient,
      )
    "
  >
    <component :is="icon" :size="iconPx" class="text-white drop-shadow" />
  </div>
</template>

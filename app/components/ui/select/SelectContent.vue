<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { SelectContent, SelectPortal, SelectViewport } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{ class?: HTMLAttributes['class']; position?: 'item-aligned' | 'popper' }>(),
  { position: 'popper' },
)
</script>

<template>
  <SelectPortal>
    <SelectContent
      :position="props.position"
      :side-offset="6"
      :class="
        cn(
          'relative z-50 max-h-96 min-w-[10rem] overflow-hidden rounded-2xl border border-white/10 bg-[#16142199] text-foreground shadow-[0_16px_50px_rgba(0,0,0,0.55)] backdrop-blur-2xl',
          props.position === 'popper' && 'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1',
          props.class,
        )
      "
    >
      <SelectViewport class="p-1">
        <slot />
      </SelectViewport>
    </SelectContent>
  </SelectPortal>
</template>

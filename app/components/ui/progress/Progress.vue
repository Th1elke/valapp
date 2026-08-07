<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    modelValue: number
    max?: number
    class?: HTMLAttributes['class']
    barClass?: HTMLAttributes['class']
  }>(),
  { max: 100 },
)

const percent = computed(() => Math.max(0, Math.min(100, (props.modelValue / props.max) * 100)))
</script>

<template>
  <div :class="cn('h-2 w-full overflow-hidden rounded-full bg-white/10', props.class)">
    <div
      :class="cn('h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500', props.barClass)"
      :style="{ width: `${percent}%` }"
    />
  </div>
</template>

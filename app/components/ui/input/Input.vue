<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
const modelValue = defineModel<string>()
</script>

<template>
  <input
    v-model="modelValue"
    :class="
      cn(
        'flex h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
  />
</template>

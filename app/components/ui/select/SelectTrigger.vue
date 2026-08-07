<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { SelectIcon, SelectTrigger } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <SelectTrigger
    :class="
      cn(
        'flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground transition-colors hover:bg-white/[0.07] focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
        props.class,
      )
    "
  >
    <slot />
    <SelectIcon as-child>
      <ChevronDown class="h-4 w-4 shrink-0 text-muted-foreground opacity-60" />
    </SelectIcon>
  </SelectTrigger>
</template>

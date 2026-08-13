<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { TabsTrigger } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class']; value: string }>()
</script>

<template>
  <TabsTrigger
    :value="props.value"
    :class="
      cn(
        'rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:bg-white/10 data-[state=active]:text-foreground',
        props.class,
      )
    "
  >
    <slot />
  </TabsTrigger>
</template>

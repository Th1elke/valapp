<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AccordionItem } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class']; value: string }>()
</script>

<template>
  <AccordionItem :value="props.value" :class="cn('glass-inset overflow-hidden rounded-2xl', props.class)">
    <slot />
  </AccordionItem>
</template>

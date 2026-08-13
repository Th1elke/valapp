<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AccordionContent } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <AccordionContent
    :class="
      cn(
        'overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
        props.class,
      )
    "
  >
    <div class="divide-y divide-white/5 border-t border-white/5">
      <slot />
    </div>
  </AccordionContent>
</template>

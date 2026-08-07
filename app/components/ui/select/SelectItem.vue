<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Check } from 'lucide-vue-next'
import { SelectItem, SelectItemIndicator, SelectItemText } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class']; value: string; disabled?: boolean }>()
</script>

<template>
  <SelectItem
    :value="props.value"
    :disabled="props.disabled"
    :class="
      cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-xl py-2 pl-8 pr-2 text-sm text-foreground outline-none transition-colors data-[highlighted]:bg-white/10 data-[highlighted]:outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        props.class,
      )
    "
  >
    <span class="absolute left-2 flex h-4 w-4 items-center justify-center">
      <SelectItemIndicator>
        <Check class="h-4 w-4" />
      </SelectItemIndicator>
    </span>
    <SelectItemText>
      <slot />
    </SelectItemText>
  </SelectItem>
</template>

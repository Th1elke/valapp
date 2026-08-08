<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import type { Component } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{ label: string; icon: Component; type?: string }>()
const model = defineModel<string>()

const showPassword = ref(false)
const isPassword = computed(() => props.type === 'password')
const inputType = computed(() => (isPassword.value ? (showPassword.value ? 'text' : 'password') : (props.type ?? 'text')))
</script>

<template>
  <label class="block space-y-1.5">
    <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{{ label }}</span>
    <div class="relative">
      <component :is="icon" :size="16" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input v-model="model" :type="inputType" v-bind="$attrs" :class="['pl-10', isPassword ? 'pr-10' : 'pr-3.5']" />
      <button
        v-if="isPassword"
        type="button"
        tabindex="-1"
        class="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        @click="showPassword = !showPassword"
      >
        <component :is="showPassword ? EyeOff : Eye" :size="16" />
      </button>
    </div>
  </label>
</template>

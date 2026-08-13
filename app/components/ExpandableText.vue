<script setup lang="ts">
const props = withDefaults(defineProps<{ text: string; limit?: number }>(), { limit: 180 })

const expanded = ref(false)
const isLong = computed(() => props.text.length > props.limit)
const displayText = computed(() => (expanded.value || !isLong.value ? props.text : props.text.slice(0, props.limit).trimEnd() + '…'))
</script>

<template>
  <p class="text-sm text-muted-foreground">
    {{ displayText }}
    <button
      v-if="isLong"
      type="button"
      class="text-primary hover:underline"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'ver menos' : 'ver mais' }}
    </button>
  </p>
</template>

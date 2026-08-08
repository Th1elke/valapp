<script setup lang="ts">
defineProps<{ title: string; subtitle: string }>()
</script>

<template>
  <div class="mx-auto w-full max-w-sm">
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl">{{ title }}</h1>
      <p class="mt-2 text-sm text-muted-foreground">{{ subtitle }}</p>
    </div>

    <div class="glass-panel space-y-5 p-8">
      <slot />
    </div>

    <p class="mt-6 text-center text-sm text-muted-foreground">
      <slot name="footer" />
    </p>
  </div>
</template>

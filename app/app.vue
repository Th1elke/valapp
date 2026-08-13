<script setup lang="ts">
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <ClientOnly>
    <Toaster theme="dark" rich-colors :toast-options="{ classNames: { toast: 'glass-panel' } }" />
  </ClientOnly>
</template>

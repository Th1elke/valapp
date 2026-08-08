<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-background p-6">
    <div class="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-[100px]" />
    <NuxtLink to="/inicio" class="absolute left-6 top-6 z-10 flex items-center gap-2">
      <img src="/img/logo-val.png" alt="" class="h-9 w-9" />
      <span class="text-lg font-semibold">val<span class="text-primary">.</span></span>
    </NuxtLink>
    <div class="relative z-10 w-full">
      <slot />
    </div>
  </div>
</template>

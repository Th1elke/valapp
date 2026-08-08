<template>
  <div class="relative min-h-screen overflow-x-hidden bg-background">
    <div class="pointer-events-none absolute -left-24 -top-24 h-72 w-72 max-w-[60vw] rounded-full blur-[100px]" style="background: hsl(var(--primary) / 0.2)" />
    <div class="pointer-events-none absolute -right-24 top-1/4 h-72 w-72 max-w-[60vw] rounded-full blur-[100px]" style="background: hsl(var(--primary) / 0.12)" />
    <div class="relative z-10">
      <slot />
    </div>
  </div>
</template>

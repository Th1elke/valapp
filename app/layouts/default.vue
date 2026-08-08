<template>
  <div class="relative min-h-screen bg-background">
    <div class="pointer-events-none fixed -left-40 -top-40 h-96 w-96 rounded-full blur-[120px]" style="background: hsl(var(--primary) / 0.2)" />
    <div class="pointer-events-none fixed -right-40 top-1/3 h-96 w-96 rounded-full blur-[120px]" style="background: hsl(var(--primary) / 0.12)" />
    <div class="pointer-events-none fixed bottom-0 left-1/3 h-96 w-96 rounded-full blur-[120px]" style="background: hsl(var(--ring) / 0.12)" />

    <div class="relative z-10 flex min-h-screen">
      <AppSidebar />
      <main class="min-w-0 flex-1 p-6">
        <div class="mx-auto max-w-[1600px]">
          <AppHeader />
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

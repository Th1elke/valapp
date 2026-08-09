<template>
  <div class="relative min-h-screen bg-background">
    <div class="pointer-events-none fixed -left-40 -top-40 h-96 w-96 rounded-full blur-[120px]" style="background: hsl(var(--primary) / 0.2)" />

    <div class="relative z-10 flex min-h-screen">
      <AppSidebar />
      <main class="min-w-0 flex-1 p-4 pb-24 sm:p-6 sm:pb-6">
        <div class="mx-auto max-w-[1600px]">
          <AppHeader />
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

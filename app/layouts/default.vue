<template>
  <div class="relative min-h-screen overflow-hidden bg-background">
    <div class="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-violet-600/30 blur-[120px]" />
    <div class="pointer-events-none absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-[120px]" />
    <div class="pointer-events-none absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />

    <div class="relative z-10 mx-auto flex max-w-6xl gap-6 p-6">
      <AppSidebar />
      <main class="min-w-0 flex-1 py-2">
        <slot />
      </main>
    </div>
  </div>
</template>

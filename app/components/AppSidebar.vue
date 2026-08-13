<script setup lang="ts">
import { BookOpen, Calendar, FlaskConical, LayoutDashboard, ListChecks, ScrollText, Store, Trophy, UserRound } from 'lucide-vue-next'

const route = useRoute()

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/habitos', label: 'Hábitos', icon: ListChecks },
  { to: '/missoes', label: 'Missões', icon: ScrollText },
  { to: '/agenda', label: 'Agenda', icon: Calendar },
  { to: '/grimorio', label: 'Grimório', icon: BookOpen },
  { to: '/loja', label: 'Taverna', icon: Store },
  { to: '/evolucao', label: 'Evolução', icon: Trophy },
  { to: '/perfil', label: 'Perfil', icon: UserRound },
  ...(import.meta.dev ? [{ to: '/dev', label: 'Painel de Teste', icon: FlaskConical }] : []),
]
</script>

<template>
  <aside class="sticky top-0 hidden h-screen w-20 shrink-0 flex-col items-center gap-2 border-r border-white/10 bg-card/90 py-6 shadow-[8px_0_40px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:flex">
    <div class="mb-4 flex h-11 w-11 cursor-default items-center justify-center">
      <img src="/img/logo-val.png" alt="Val" class="h-9 w-9" draggable="false" />
    </div>
    <NuxtLink
      v-for="item in nav"
      :key="item.to"
      :to="item.to"
      :title="item.label"
      class="flex h-12 w-12 items-center justify-center rounded-2xl transition-colors"
      :class="
        route.path === item.to
          ? 'bg-white/10 text-white'
          : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
      "
    >
      <component :is="item.icon" :size="20" />
    </NuxtLink>
  </aside>

  <nav class="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-white/10 bg-card/95 py-2 shadow-[0_-8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:hidden">
    <NuxtLink
      v-for="item in nav"
      :key="item.to"
      :to="item.to"
      :title="item.label"
      class="flex h-11 w-11 items-center justify-center rounded-2xl transition-colors"
      :class="
        route.path === item.to
          ? 'bg-white/10 text-white'
          : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
      "
    >
      <component :is="item.icon" :size="20" />
    </NuxtLink>
  </nav>
</template>

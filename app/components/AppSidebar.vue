<script setup lang="ts">
import { BookOpen, LayoutDashboard, ListChecks, ScrollText, Store, UserRound } from 'lucide-vue-next'

const route = useRoute()
const { data: user } = useUserState()

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/habitos', label: 'Hábitos', icon: ListChecks },
  { to: '/missoes', label: 'Missões', icon: ScrollText },
  { to: '/grimorio', label: 'Grimório', icon: BookOpen },
  { to: '/loja', label: 'Taverna', icon: Store },
  { to: '/perfil', label: 'Perfil', icon: UserRound },
]
</script>

<template>
  <aside class="glass-panel flex h-fit w-20 shrink-0 flex-col items-center gap-2 py-6">
    <NuxtLink to="/perfil" title="Perfil" class="mb-4">
      <ClassAvatar :player-class="user?.playerClass ?? null" :level="user?.level ?? 1" size="sm" />
    </NuxtLink>
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
</template>

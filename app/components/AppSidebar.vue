<script setup lang="ts">
import { BookOpen, FlaskConical, LayoutDashboard, ListChecks, ScrollText, Store, UserRound } from 'lucide-vue-next'

const route = useRoute()
const { data: user } = useUserState()

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/habitos', label: 'Hábitos', icon: ListChecks },
  { to: '/missoes', label: 'Missões', icon: ScrollText },
  { to: '/grimorio', label: 'Grimório', icon: BookOpen },
  { to: '/loja', label: 'Taverna', icon: Store },
  { to: '/perfil', label: 'Perfil', icon: UserRound },
  ...(import.meta.dev ? [{ to: '/dev', label: 'Painel de Teste', icon: FlaskConical }] : []),
]
</script>

<template>
  <aside class="sticky top-0 flex h-screen w-20 shrink-0 flex-col items-center gap-2 border-r border-white/10 bg-card/90 py-6 shadow-[8px_0_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
    <NuxtLink to="/perfil" title="Perfil" class="mb-4">
      <ClassAvatar
        :player-class="user?.playerClass ?? null"
        :level="user?.level ?? 1"
        :border-id="user?.equippedAvatarBorder"
        :avatar-url="user?.avatarUrl"
        size="sm"
      />
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

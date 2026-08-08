<script setup lang="ts">
import { Coins, LogOut } from 'lucide-vue-next'

const { data: user } = useUserState()
const { clear: clearSession } = useUserSession()

async function logout() {
  await clearSession()
  // Zera o cache de `useUserState()` (mesma key 'user' em todo o app) — sem isso o plugin de
  // tema (`theme.client.ts`) continua enxergando o `equippedTheme` antigo e a cor fica presa
  // mesmo deslogado, destoando do roxo padrão do site nas telas públicas.
  user.value = null
  await navigateTo('/inicio')
}
</script>

<template>
  <header v-if="user" class="mb-6 flex items-center justify-between gap-4">
    <h1 class="text-2xl font-semibold">Olá, {{ user.name }}</h1>
    <div class="flex items-center gap-3">
      <div class="glass-inset flex items-center gap-2 rounded-full px-3 py-1.5 text-sm">
        <Coins :size="14" class="text-amber-400" />
        <span class="font-semibold">{{ user.gold }}</span>
      </div>
      <NuxtLink to="/perfil" title="Perfil">
        <ClassAvatar
          :player-class="user.playerClass"
          :level="user.level"
          :border-id="user.equippedAvatarBorder"
          :avatar-url="user.avatarUrl"
          size="sm"
        />
      </NuxtLink>
      <button
        type="button"
        title="Sair"
        class="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        @click="logout"
      >
        <LogOut :size="16" />
      </button>
    </div>
  </header>
</template>

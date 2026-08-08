<script setup lang="ts">
import { Coins } from 'lucide-vue-next'

const { data: user } = useUserState()
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
    </div>
  </header>
</template>

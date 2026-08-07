<script setup lang="ts">
import { Award, Coins, Flame, Heart, Shield, Sparkles, Sword, Wand2 } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { MAX_SHIELDS } from '#shared/economy'
import { getClassInfo } from '#shared/gamification'
import type { PlayerClass } from '#shared/types'

const { data: user, refresh: refreshUser } = useUserState()
const { data: habits } = useHabits()
const { data: stats } = useAttributeStats()

const classInfo = computed(() => (user.value ? getClassInfo(user.value.playerClass, user.value.level) : null))
const xpIntoLevel = computed(() => (user.value ? user.value.xp - user.value.xpFloor : 0))
const xpNeeded = computed(() => (user.value ? Math.max(1, user.value.xpCeil - user.value.xpFloor) : 1))
const longestStreak = computed(() => Math.max(0, ...(habits.value ?? []).map((h) => h.longestStreak)))

const canChooseClass = computed(() => !!user.value && user.value.level >= 5 && !user.value.playerClass)
const choosing = ref(false)
const classOptions: { value: PlayerClass; label: string; icon: typeof Sword; description: string }[] = [
  { value: 'guerreiro', label: 'Guerreiro', icon: Sword, description: '+15% XP em hábitos Físicos' },
  { value: 'mago', label: 'Mago', icon: Wand2, description: '+15% XP em hábitos de Mente' },
  { value: 'paladino', label: 'Paladino', icon: Shield, description: 'Reduz perda de HP em 50%' },
]

async function pickClass(playerClass: PlayerClass) {
  choosing.value = true
  try {
    await chooseClass(playerClass)
    await refreshUser()
  } finally {
    choosing.value = false
  }
}

const milestones = [
  { level: 5, label: 'Escolha de classe', icon: Sparkles },
  { level: 15, label: 'Sub-evolução (Cavaleiro / Arcanista / Templário)', icon: Award },
  { level: 30, label: 'Sub-evolução máxima (Campeão / Arquimago / Cruzado)', icon: Award },
]
</script>

<template>
  <div v-if="user" class="space-y-6">
    <div class="glass-panel flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left">
      <ClassAvatar :player-class="user.playerClass" :level="user.level" size="lg" />
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <h1 class="text-2xl font-semibold">{{ user.name }}</h1>
          <Badge>{{ classInfo?.label }}</Badge>
        </div>
        <p class="text-muted-foreground">Nível {{ user.level }} · {{ user.xp }} XP total</p>
        <Progress :model-value="xpIntoLevel" :max="xpNeeded" class="mt-3 max-w-sm" />
        <p class="mt-1 text-xs text-muted-foreground">{{ xpIntoLevel }} / {{ xpNeeded }} XP para o nível {{ user.level + 1 }}</p>
      </div>
    </div>

    <div v-if="canChooseClass" class="glass-panel space-y-4 p-5">
      <h2 class="font-semibold">Escolha sua classe</h2>
      <div class="grid gap-3 sm:grid-cols-3">
        <button
          v-for="option in classOptions"
          :key="option.value"
          type="button"
          :disabled="choosing"
          class="glass-inset glass-panel-hover flex flex-col items-center gap-2 rounded-2xl p-4 text-center disabled:opacity-50"
          @click="pickClass(option.value)"
        >
          <component :is="option.icon" :size="24" />
          <p class="font-medium">{{ option.label }}</p>
          <p class="text-xs text-muted-foreground">{{ option.description }}</p>
        </button>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-4">
      <Card class="glass-panel border-0">
        <CardContent class="flex items-center gap-3 pt-6">
          <Heart :size="20" class="text-rose-400" />
          <div>
            <p class="text-xs text-muted-foreground">Vida atual</p>
            <p class="text-lg font-semibold">{{ user.hp }} / 100</p>
          </div>
        </CardContent>
      </Card>
      <Card class="glass-panel border-0">
        <CardContent class="flex items-center gap-3 pt-6">
          <Coins :size="20" class="text-amber-400" />
          <div>
            <p class="text-xs text-muted-foreground">Ouro</p>
            <p class="text-lg font-semibold">{{ user.gold }}</p>
          </div>
        </CardContent>
      </Card>
      <Card class="glass-panel border-0">
        <CardContent class="flex items-center gap-3 pt-6">
          <Flame :size="20" class="text-orange-400" />
          <div>
            <p class="text-xs text-muted-foreground">Maior sequência</p>
            <p class="text-lg font-semibold">{{ longestStreak }} dias</p>
          </div>
        </CardContent>
      </Card>
      <Card class="glass-panel border-0">
        <CardContent class="flex items-center gap-3 pt-6">
          <Shield :size="20" class="text-violet-400" />
          <div>
            <p class="text-xs text-muted-foreground">Escudos disponíveis</p>
            <p class="text-lg font-semibold">{{ user.shieldsRemaining }} / {{ MAX_SHIELDS }}</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <div v-if="stats" class="glass-panel p-5">
      <h2 class="mb-1 font-semibold">Atributos</h2>
      <p class="mb-2 text-sm text-muted-foreground">XP acumulado por área — mostra seu estilo de jogo na vida real</p>
      <AttributeRadar :stats="stats" />
    </div>

    <div class="glass-panel p-5">
      <h2 class="mb-4 font-semibold">Evolução da classe</h2>
      <div class="space-y-3">
        <div
          v-for="milestone in milestones"
          :key="milestone.level"
          class="flex items-center gap-3 rounded-2xl p-3"
          :class="user.level >= milestone.level ? 'glass-inset' : 'opacity-40'"
        >
          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br" :class="classInfo?.gradient">
            <component :is="milestone.icon" :size="16" class="text-white" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium">Nível {{ milestone.level }}</p>
            <p class="text-xs text-muted-foreground">{{ milestone.label }}</p>
          </div>
          <Badge v-if="user.level >= milestone.level" variant="success">Alcançado</Badge>
        </div>
      </div>
    </div>
  </div>
</template>

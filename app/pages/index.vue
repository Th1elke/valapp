<script setup lang="ts">
import { Coins, Flame, Heart, HeartCrack, RotateCcw, ScrollText, ShieldCheck, Sparkles } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { getClassInfo } from '#shared/gamification'
import type { DailyClosureResultDTO } from '#shared/types'

const { data: user, refresh: refreshUser } = useUserState()
const { data: habits, refresh: refreshHabits } = useHabits()
const { data: missions } = useMissions()

async function toggleHabit(id: string) {
  const habit = habits.value?.find((h) => h.id === id)
  if (!habit || habit.status !== 'ativo') return
  if (habit.doneToday) {
    await undoCheckin(id)
  } else {
    await checkinHabit(id)
  }
  await Promise.all([refreshHabits(), refreshUser()])
}

const closingDay = ref(false)
const relapseInfo = ref<DailyClosureResultDTO | null>(null)
const levelBeforeClosure = ref(0)

async function closeYesterday() {
  closingDay.value = true
  levelBeforeClosure.value = user.value?.level ?? 0
  try {
    const result = await runDailyClosure()
    await Promise.all([refreshHabits(), refreshUser()])
    if (result.relapsed) relapseInfo.value = result
  } finally {
    closingDay.value = false
  }
}

const classInfo = computed(() => (user.value ? getClassInfo(user.value.playerClass, user.value.level) : null))
const xpIntoLevel = computed(() => (user.value ? user.value.xp - user.value.xpFloor : 0))
const xpNeeded = computed(() => (user.value ? Math.max(1, user.value.xpCeil - user.value.xpFloor) : 1))

const activeHabits = computed(() => (habits.value ?? []).filter((h) => h.status === 'ativo'))
const doneCount = computed(() => activeHabits.value.filter((h) => h.doneToday).length)
const isPerfectDay = computed(() => activeHabits.value.length > 0 && doneCount.value === activeHabits.value.length)
</script>

<template>
  <div v-if="user" class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h1 class="text-2xl font-semibold">Olá, {{ user.name }}</h1>
        <p class="text-muted-foreground">Vamos manter a sequência hoje?</p>
      </div>
      <div class="flex items-center gap-2">
        <div class="glass-inset flex items-center gap-2 rounded-full px-3 py-1.5 text-sm">
          <Coins :size="14" class="text-amber-400" />
          <span class="font-semibold">{{ user.gold }}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          :disabled="closingDay"
          title="Aplica punição de HP / bônus de dia perfeito de ontem (provisório até termos um job agendado)"
          @click="closeYesterday"
        >
          <RotateCcw :size="14" />
          {{ closingDay ? 'Processando…' : 'Fechar dia de ontem' }}
        </Button>
      </div>
    </div>

    <NuxtLink
      v-if="missions?.length"
      to="/missoes"
      class="glass-panel glass-panel-hover flex items-center gap-3 p-4 text-sm"
    >
      <ScrollText :size="18" class="text-violet-400" />
      <span>Você tem <strong>{{ missions.length }}</strong> missão(ões) ativa(s) esperando</span>
    </NuxtLink>

    <div class="grid gap-4 md:grid-cols-3">
      <Card class="glass-panel border-0">
        <CardContent class="flex items-center gap-4 pt-6">
          <ClassAvatar :player-class="user.playerClass" :level="user.level" size="md" />
          <div class="min-w-0">
            <p class="text-sm text-muted-foreground">{{ classInfo?.label }}</p>
            <p class="text-lg font-semibold">Nível {{ user.level }}</p>
          </div>
        </CardContent>
        <CardContent class="pt-0">
          <Progress :model-value="xpIntoLevel" :max="xpNeeded" />
          <p class="mt-1.5 text-xs text-muted-foreground">{{ xpIntoLevel }} / {{ xpNeeded }} XP para o próximo nível</p>
        </CardContent>
      </Card>

      <Card class="glass-panel border-0">
        <CardHeader class="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">Vida</CardTitle>
          <Heart :size="16" class="text-rose-400" />
        </CardHeader>
        <CardContent>
          <p class="text-2xl font-semibold">{{ user.hp }} HP</p>
          <Progress :model-value="user.hp" :max="100" class="mt-3" bar-class="from-rose-500 to-orange-400" />
          <p class="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <ShieldCheck :size="14" /> {{ user.shieldsRemaining }} escudo(s) disponível(is)
          </p>
        </CardContent>
      </Card>

      <Card class="glass-panel border-0">
        <CardHeader class="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">Dia de hoje</CardTitle>
          <Sparkles :size="16" class="text-amber-300" />
        </CardHeader>
        <CardContent>
          <p class="text-2xl font-semibold">{{ doneCount }} / {{ activeHabits.length }}</p>
          <p class="mt-1 text-xs" :class="isPerfectDay ? 'text-emerald-400' : 'text-muted-foreground'">
            {{ isPerfectDay ? 'Dia perfeito! +15 XP e +10 ouro no fechamento do dia' : 'hábitos concluídos' }}
          </p>
        </CardContent>
      </Card>
    </div>

    <div class="glass-panel p-5">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="font-semibold">Hábitos de hoje</h2>
        <span class="flex items-center gap-1 text-xs text-muted-foreground">
          <Flame :size="14" class="text-orange-400" /> sequência atual
        </span>
      </div>
      <div v-if="activeHabits.length" class="space-y-2">
        <HabitCard v-for="habit in activeHabits" :key="habit.id" :habit="habit" @toggle="toggleHabit" />
      </div>
      <p v-else class="text-center text-sm text-muted-foreground">Nenhum hábito ativo ainda. Cadastre um na aba Hábitos.</p>
    </div>

    <Teleport to="body">
      <div v-if="relapseInfo" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
        <div class="glass-panel w-full max-w-sm border-red-500/30 p-8 text-center">
          <HeartCrack :size="48" class="mx-auto mb-4 text-red-500" />
          <h2 class="mb-1 text-2xl font-bold text-red-400">Você recaiu</h2>
          <p class="mb-4 text-sm text-muted-foreground">Seu HP chegou a 0 — a sequência cobrou o preço.</p>
          <div class="glass-inset mb-5 space-y-1 rounded-2xl p-4 text-sm">
            <p>Nível {{ levelBeforeClosure }} → <strong>{{ Math.max(1, levelBeforeClosure - 1) }}</strong></p>
            <p>HP restaurado para <strong>50</strong></p>
            <p class="text-muted-foreground">Ouro e classe não foram afetados.</p>
          </div>
          <Button class="w-full rounded-full" @click="relapseInfo = null">Continuar</Button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

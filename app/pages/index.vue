<script setup lang="ts">
import { Check, Flame, Heart, HeartCrack, Pencil, RotateCcw, ScrollText, ShieldCheck, Sparkles, Swords } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { TITLES } from '#shared/cosmetics'
import { todayStr } from '#shared/date'
import { getClassInfo } from '#shared/gamification'
import { isHabitScheduled } from '#shared/habitSchedule'
import type { DailyClosureResultDTO } from '#shared/types'

const { data: user, refresh: refreshUser } = useUserState()
const { data: habits, refresh: refreshHabits } = useHabits()
const { data: missions } = useMissions()
const { data: stats, refresh: refreshStats } = useAttributeStats()

const { el: doneListEl, onPointerDown: onDoneListDown, onPointerMove: onDoneListMove, onPointerUp: onDoneListUp } = useDragScroll('y')

async function toggleHabit(id: string) {
  const habit = habits.value?.find((h) => h.id === id)
  if (!habit || habit.status !== 'ativo') return
  if (habit.doneToday) {
    await undoCheckin(id)
  } else {
    await checkinHabit(id)
  }
  await Promise.all([refreshHabits(), refreshUser(), refreshStats()])
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

const editingName = ref(false)
const nameDraft = ref('')
const nameInput = ref<InstanceType<typeof Input> | null>(null)
const savingName = ref(false)

function startEditingName() {
  nameDraft.value = user.value?.name ?? ''
  editingName.value = true
  nextTick(() => nameInput.value?.$el?.focus())
}

async function saveName() {
  const trimmed = nameDraft.value.trim()
  if (!trimmed || trimmed === user.value?.name) {
    editingName.value = false
    return
  }
  savingName.value = true
  try {
    await updateUserName(trimmed)
    await refreshUser()
    editingName.value = false
  } finally {
    savingName.value = false
  }
}

const classInfo = computed(() => (user.value ? getClassInfo(user.value.playerClass, user.value.level) : null))
const equippedTitleName = computed(() => TITLES.find((t) => t.id === user.value?.equippedTitle)?.name ?? null)
const xpIntoLevel = computed(() => (user.value ? user.value.xp - user.value.xpFloor : 0))
const xpNeeded = computed(() => (user.value ? Math.max(1, user.value.xpCeil - user.value.xpFloor) : 1))

const today = todayStr()
const activeHabits = computed(() =>
  (habits.value ?? []).filter((h) => h.status === 'ativo' && isHabitScheduled(h.frequency, h.customDays, today)),
)
// Hábitos `semanal` ("N vezes por semana, qualquer dia") não entram na conta de dia perfeito —
// eles só são avaliados uma vez por semana (server/utils/dailyClosure.ts), então "não feito hoje"
// não significa nada pra eles isoladamente. Continuam aparecendo na lista "Hábitos de hoje" porque
// dá pra fazer o check-in em qualquer dia.
const dailyRatioHabits = computed(() => activeHabits.value.filter((h) => h.frequency !== 'semanal'))
const doneCount = computed(() => dailyRatioHabits.value.filter((h) => h.doneToday).length)
const isPerfectDay = computed(() => dailyRatioHabits.value.length > 0 && doneCount.value === dailyRatioHabits.value.length)
</script>

<template>
  <div v-if="user" class="space-y-6">
    <div class="grid gap-4 lg:grid-cols-3">
      <div class="hero-panel flex flex-col gap-5 p-6 lg:col-span-2">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="flex items-center gap-4">
            <ClassAvatar
              :player-class="user.playerClass"
              :level="user.level"
              :border-id="user.equippedAvatarBorder"
              :avatar-url="user.avatarUrl"
              size="lg"
            />
            <div class="min-w-0">
              <div v-if="editingName" class="flex items-center gap-2">
                <Input
                  ref="nameInput"
                  v-model="nameDraft"
                  class="h-8 max-w-[10rem] py-1"
                  maxlength="30"
                  :disabled="savingName"
                  @keyup.enter="saveName"
                  @keyup.escape="editingName = false"
                  @blur="saveName"
                />
                <Check :size="16" class="shrink-0 text-emerald-400" />
              </div>
              <button
                v-else
                type="button"
                class="group/name flex items-center gap-1.5 text-lg font-semibold"
                @click="startEditingName"
              >
                {{ user.name }}
                <Pencil :size="13" class="text-muted-foreground opacity-0 transition-opacity group-hover/name:opacity-100" />
              </button>
              <p v-if="equippedTitleName" class="text-sm font-medium text-amber-300">{{ equippedTitleName }}</p>
              <p class="text-muted-foreground">Vamos manter a sequência hoje?</p>
              <div class="mt-2 flex items-center gap-2">
                <Badge>{{ classInfo?.label }}</Badge>
                <span class="text-sm text-muted-foreground">Nível {{ user.level }}</span>
              </div>
            </div>
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
        <div>
          <Progress :model-value="xpIntoLevel" :max="xpNeeded" class="glow-primary" />
          <p class="mt-1.5 text-xs text-muted-foreground">{{ xpIntoLevel }} / {{ xpNeeded }} XP para o nível {{ user.level + 1 }}</p>
        </div>
      </div>

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

      <Card v-if="stats" class="glass-panel border-0">
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">Atributos</CardTitle>
        </CardHeader>
        <CardContent>
          <AttributeRadar :stats="stats" />
        </CardContent>
      </Card>

      <Card class="glass-panel border-0">
        <CardHeader class="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">Itens Ativos</CardTitle>
          <Swords :size="16" class="text-primary" />
        </CardHeader>
        <CardContent>
          <ActiveItemsWidget :inventory="user.inventory" @used="refreshUser" />
        </CardContent>
      </Card>

      <Card class="glass-panel border-0">
        <CardHeader class="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">Dia de hoje</CardTitle>
          <Sparkles :size="16" class="text-amber-300" />
        </CardHeader>
        <CardContent>
          <p class="text-2xl font-semibold">{{ doneCount }} / {{ dailyRatioHabits.length }}</p>
          <p class="mt-1 text-xs" :class="isPerfectDay ? 'text-emerald-400' : 'text-muted-foreground'">
            {{ isPerfectDay ? 'Dia perfeito! +15 XP e +10 ouro no fechamento do dia' : 'hábitos concluídos' }}
          </p>
          <ul
            v-if="doneCount > 0"
            ref="doneListEl"
            class="no-scrollbar mt-3 max-h-64 cursor-grab select-none space-y-2 overflow-y-auto active:cursor-grabbing"
            @pointerdown="onDoneListDown"
            @pointermove="onDoneListMove"
            @pointerup="onDoneListUp"
            @pointerleave="onDoneListUp"
          >
            <li
              v-for="habit in activeHabits.filter((h) => h.doneToday)"
              :key="habit.id"
              class="glass-inset pointer-events-none flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-foreground"
            >
              <Check :size="18" class="shrink-0 text-emerald-400" />
              <span class="truncate">{{ habit.name }}</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <NuxtLink
        v-if="missions?.length"
        to="/missoes"
        class="glass-panel glass-panel-hover flex items-center gap-3 p-4 text-sm lg:col-span-3"
      >
        <ScrollText :size="18" class="text-violet-400" />
        <span>Você tem <strong>{{ missions.length }}</strong> missão(ões) ativa(s) esperando</span>
      </NuxtLink>

      <div class="glass-panel p-5 lg:col-span-3">
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
    </div>

    <Teleport to="body">
      <div v-if="relapseInfo" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
        <div class="glass-panel w-full max-w-sm border-red-500/30 p-8 text-center">
          <HeartCrack :size="48" class="mx-auto mb-4 text-red-500" />
          <h2 class="mb-1 text-2xl font-bold text-red-400">Você recaiu</h2>
          <p class="mb-4 text-sm text-muted-foreground">Seu HP chegou a 0 — a sequência cobrou o preço.</p>
          <div class="glass-inset mb-5 space-y-1 rounded-2xl p-4 text-sm">
            <p>Perdeu <strong>{{ Math.abs(relapseInfo.xpChange) }} XP</strong></p>
            <p v-if="user && user.level < levelBeforeClosure">Nível {{ levelBeforeClosure }} → <strong>{{ user.level }}</strong></p>
            <p v-else>Nível <strong>{{ levelBeforeClosure }}</strong> mantido</p>
            <p>HP restaurado para <strong>{{ user?.hp ?? '—' }}</strong></p>
            <p class="text-muted-foreground">Ouro e classe não foram afetados.</p>
          </div>
          <Button class="w-full rounded-full" @click="relapseInfo = null">Continuar</Button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

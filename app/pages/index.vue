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
import { containsEmoji, MAX_NAME_LENGTH } from '#shared/validation'

const { data: user, refresh: refreshUser } = useUserState()
const { data: habits, refresh: refreshHabits } = useHabits()
const { data: missions } = useMissions()
const { refresh: refreshStats } = useAttributeStats()
const toast = useAppToast()

const activeMissionsCount = computed(() => missions.value?.filter((m) => m.status === 'ativa').length ?? 0)

const { el: doneListEl, onPointerDown: onDoneListDown, onPointerMove: onDoneListMove, onPointerUp: onDoneListUp } = useDragScroll('y')

// +N XP flutuante perto do card marcado, some sozinho — feedback imediato de recompensa (docs 4).
const floatingXp = ref<{ habitId: string; amount: number } | null>(null)

async function toggleHabit(id: string) {
  const habit = habits.value?.find((h) => h.id === id)
  if (!habit || habit.status !== 'ativo') return
  if (habit.doneToday) {
    await undoCheckin(id)
  } else {
    const result = await checkinHabit(id)
    if (result.xpAwarded > 0) {
      floatingXp.value = { habitId: id, amount: result.xpAwarded }
      toast.success(`+${result.xpAwarded} XP`)
      setTimeout(() => {
        if (floatingXp.value?.habitId === id) floatingXp.value = null
      }, 1200)
    }
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
  if (containsEmoji(trimmed)) return
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

// Conta a barra de XP subindo até o novo valor em vez de saltar direto — reforça o check-in (docs 4).
const xpDisplay = ref(0)
watch(
  xpIntoLevel,
  (target, previous) => {
    if (!import.meta.client || prefersReducedMotion()) {
      xpDisplay.value = target
      return
    }
    const start = previous ?? target
    const startTime = performance.now()
    const duration = 700
    function tick(now: number) {
      const progress = Math.min(1, (now - startTime) / duration)
      const eased = 1 - (1 - progress) ** 3
      xpDisplay.value = Math.round(start + (target - start) * eased)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  },
  { immediate: true },
)

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
                  :maxlength="MAX_NAME_LENGTH"
                  :disabled="savingName"
                  @keyup.enter="saveName"
                  @keyup.escape="editingName = false"
                  @blur="saveName"
                />
                <Check :size="16" class="shrink-0 text-success" />
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
          <Progress :model-value="xpDisplay" :max="xpNeeded" class="glow-primary" />
          <p class="mt-1.5 text-xs text-muted-foreground">{{ xpDisplay }} / {{ xpNeeded }} XP para o nível {{ user.level + 1 }}</p>
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

      <Card class="glass-panel border-0 lg:col-span-2">
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
          <p class="mt-1 text-xs" :class="isPerfectDay ? 'text-success' : 'text-muted-foreground'">
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
              <Check :size="18" class="shrink-0 text-success" />
              <span class="truncate">{{ habit.name }}</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <NuxtLink
        v-if="activeMissionsCount"
        to="/missoes"
        class="glass-panel glass-panel-hover flex items-center gap-3 p-4 text-sm lg:col-span-3"
      >
        <ScrollText :size="18" class="text-violet-400" />
        <span>Você tem <strong>{{ activeMissionsCount }}</strong> missão(ões) ativa(s) esperando</span>
      </NuxtLink>

      <div class="glass-panel p-5 lg:col-span-3">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="font-semibold">Hábitos de hoje</h2>
          <span class="flex items-center gap-1 text-xs text-muted-foreground">
            <Flame :size="14" class="text-orange-400" /> sequência atual
          </span>
        </div>
        <div v-if="activeHabits.length" class="space-y-2">
          <HabitCard
            v-for="habit in activeHabits"
            :key="habit.id"
            :habit="habit"
            :xp-float="floatingXp?.habitId === habit.id ? floatingXp.amount : null"
            @toggle="toggleHabit"
          />
        </div>
        <p v-else class="text-center text-sm text-muted-foreground">Nenhum hábito ativo ainda. Cadastre um na aba Hábitos.</p>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="relapseInfo" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
        <div class="glass-panel w-full max-w-sm border-destructive/30 p-8 text-center">
          <HeartCrack :size="48" class="mx-auto mb-4 text-destructive" />
          <h2 class="mb-1 text-2xl font-bold text-destructive">Você recaiu</h2>
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

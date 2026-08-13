<script setup lang="ts">
import { ChevronLeft, ChevronRight, Coins } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { WEEKDAY_LABELS } from '#shared/habitSchedule'
import { formatDateStr, toDateStr, todayStr } from '#shared/date'
import { categoryLabel, difficultyLabel, type MissionDTO } from '#shared/types'

const { data: missions } = useMissions()

const today = todayStr()
const [todayYear, todayMonth] = today.split('-').map(Number)
const viewYear = ref(todayYear!)
const viewMonth = ref(todayMonth! - 1) // 0-indexed
const selectedDate = ref(today)

function shiftMonth(delta: number) {
  const d = new Date(viewYear.value, viewMonth.value + delta, 1)
  viewYear.value = d.getFullYear()
  viewMonth.value = d.getMonth()
}

function goToToday() {
  viewYear.value = todayYear!
  viewMonth.value = todayMonth! - 1
  selectedDate.value = today
}

const monthLabel = computed(() => {
  const raw = new Date(viewYear.value, viewMonth.value, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
})

const missionsByDate = computed(() => {
  const map = new Map<string, MissionDTO[]>()
  for (const mission of missions.value ?? []) {
    if (!mission.deadline) continue
    const list = map.get(mission.deadline) ?? []
    list.push(mission)
    map.set(mission.deadline, list)
  }
  return map
})

const noDeadlineMissions = computed(() => (missions.value ?? []).filter((m) => !m.deadline))
const overdueMissions = computed(() => (missions.value ?? []).filter((m) => m.deadline && m.deadline < today))

interface CalendarDay {
  dateStr: string
  day: number
  inMonth: boolean
}

const calendarDays = computed<CalendarDay[]>(() => {
  const firstOfMonth = new Date(viewYear.value, viewMonth.value, 1)
  const startWeekday = firstOfMonth.getDay()
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()

  const days: CalendarDay[] = []
  for (let i = startWeekday - 1; i >= 0; i--) {
    const date = new Date(viewYear.value, viewMonth.value, -i)
    days.push({ dateStr: toDateStr(date), day: date.getDate(), inMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(viewYear.value, viewMonth.value, d)
    days.push({ dateStr: toDateStr(date), day: d, inMonth: true })
  }
  while (days.length % 7 !== 0) {
    const date = new Date(viewYear.value, viewMonth.value + 1, days.length - (startWeekday + daysInMonth) + 1)
    days.push({ dateStr: toDateStr(date), day: date.getDate(), inMonth: false })
  }
  return days
})

const selectedMissions = computed(() => missionsByDate.value.get(selectedDate.value) ?? [])
const selectedLabel = computed(() => (selectedDate.value === today ? 'Hoje' : formatDateStr(selectedDate.value)))
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold">Agenda</h1>
      <p class="text-muted-foreground">Suas missões organizadas por data</p>
    </div>

    <div v-if="overdueMissions.length" class="glass-panel space-y-1 border border-destructive/30 p-4">
      <p class="text-sm font-medium text-destructive">{{ overdueMissions.length }} missão(ões) atrasada(s)</p>
      <p class="text-xs text-muted-foreground">Confira em Missões ou clique no dia correspondente no calendário abaixo.</p>
    </div>

    <div class="glass-panel space-y-3 p-5">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">{{ monthLabel }}</h2>
        <div class="flex items-center gap-1">
          <Button variant="ghost" size="icon" class="rounded-full" title="Mês anterior" @click="shiftMonth(-1)">
            <ChevronLeft :size="18" />
          </Button>
          <Button variant="ghost" size="sm" class="rounded-full" @click="goToToday">Hoje</Button>
          <Button variant="ghost" size="icon" class="rounded-full" title="Próximo mês" @click="shiftMonth(1)">
            <ChevronRight :size="18" />
          </Button>
        </div>
      </div>

      <div class="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        <span v-for="w in WEEKDAY_LABELS" :key="w">{{ w }}</span>
      </div>

      <div class="grid grid-cols-7 gap-1">
        <button
          v-for="day in calendarDays"
          :key="day.dateStr"
          type="button"
          class="flex h-11 flex-col items-center justify-center gap-1 rounded-xl text-sm transition-colors sm:h-14"
          :class="[
            day.inMonth ? 'text-foreground' : 'text-muted-foreground/30',
            day.dateStr === selectedDate ? 'glass-inset border border-primary' : 'hover:bg-white/5',
            day.dateStr === today && day.dateStr !== selectedDate ? 'text-primary' : '',
          ]"
          @click="selectedDate = day.dateStr"
        >
          <span>{{ day.day }}</span>
          <span
            v-if="missionsByDate.get(day.dateStr)?.length"
            class="h-1.5 w-1.5 rounded-full"
            :class="day.dateStr < today ? 'bg-destructive' : 'bg-primary'"
          />
        </button>
      </div>
    </div>

    <div class="glass-panel space-y-3 p-5">
      <h2 class="font-semibold">{{ selectedLabel }}</h2>
      <div v-if="selectedMissions.length" class="divide-y divide-white/5">
        <div v-for="mission in selectedMissions" :key="mission.id" class="space-y-1.5 py-3 first:pt-0 last:pb-0">
          <p class="font-medium">{{ mission.title }}</p>
          <ExpandableText v-if="mission.description" :text="mission.description" />
          <div class="flex flex-wrap items-center gap-1.5">
            <Badge v-if="mission.category" :variant="mission.category">{{ categoryLabel[mission.category] }}</Badge>
            <template v-if="mission.status === 'standby'">
              <Badge variant="secondary">Pendente</Badge>
            </template>
            <template v-else>
              <Badge variant="secondary">{{ difficultyLabel[mission.difficulty!] }}</Badge>
              <Badge variant="warning">+{{ mission.xpReward }} XP</Badge>
              <Badge variant="warning" class="flex items-center gap-1">
                <Coins :size="10" /> +{{ mission.goldReward }}
              </Badge>
            </template>
          </div>
        </div>
      </div>
      <p v-else class="text-sm text-muted-foreground">Nenhuma missão nesse dia.</p>
    </div>

    <div v-if="noDeadlineMissions.length" class="glass-panel space-y-3 p-5">
      <h2 class="font-semibold">Sem prazo</h2>
      <div class="divide-y divide-white/5">
        <div v-for="mission in noDeadlineMissions" :key="mission.id" class="space-y-1.5 py-3 first:pt-0 last:pb-0">
          <p class="font-medium">{{ mission.title }}</p>
          <ExpandableText v-if="mission.description" :text="mission.description" />
          <div class="flex flex-wrap items-center gap-1.5">
            <Badge v-if="mission.category" :variant="mission.category">{{ categoryLabel[mission.category] }}</Badge>
            <template v-if="mission.status === 'standby'">
              <Badge variant="secondary">Pendente</Badge>
            </template>
            <template v-else>
              <Badge variant="secondary">{{ difficultyLabel[mission.difficulty!] }}</Badge>
              <Badge variant="warning">+{{ mission.xpReward }} XP</Badge>
              <Badge variant="warning" class="flex items-center gap-1">
                <Coins :size="10" /> +{{ mission.goldReward }}
              </Badge>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

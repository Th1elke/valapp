<script setup lang="ts">
import { Crown, Flame, Pause, Play, Plus, Trophy, X } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DIFFICULTY_XP } from '#shared/gamification'
import { WEEKDAY_LABELS, customDaysLabel } from '#shared/habitSchedule'
import { categoryLabel, difficultyLabel, type HabitCategory, type HabitDifficulty, type HabitFrequency } from '#shared/types'

const { data: habits, refresh } = useHabits()

const categories = Object.keys(categoryLabel) as HabitCategory[]
const difficulties = Object.keys(difficultyLabel) as HabitDifficulty[]
const weeklyTargetOptions = ['1', '2', '3', '4', '5', '6', '7']

const showForm = ref(false)
const newName = ref('')
const newCategory = ref<HabitCategory>('fisico')
const newDifficulty = ref<HabitDifficulty>('facil')
const newFrequency = ref<HabitFrequency>('diaria')
const newCustomDays = ref<number[]>([])
const newWeeklyTarget = ref('3')
const creating = ref(false)
const formError = ref('')

function toggleNewDay(day: number) {
  const idx = newCustomDays.value.indexOf(day)
  if (idx === -1) newCustomDays.value.push(day)
  else newCustomDays.value.splice(idx, 1)
}

async function submitNewHabit() {
  if (!newName.value.trim()) {
    formError.value = 'Dê um nome para o hábito.'
    return
  }
  if (newFrequency.value === 'dias_customizados' && newCustomDays.value.length === 0) {
    formError.value = 'Escolha pelo menos um dia da semana.'
    return
  }
  creating.value = true
  formError.value = ''
  try {
    await createHabit({
      name: newName.value,
      category: newCategory.value,
      difficulty: newDifficulty.value,
      frequency: newFrequency.value,
      customDays: newFrequency.value === 'dias_customizados' ? newCustomDays.value : undefined,
      weeklyTarget: newFrequency.value === 'semanal' ? Number(newWeeklyTarget.value) : undefined,
    })
    newName.value = ''
    newCategory.value = 'fisico'
    newDifficulty.value = 'facil'
    newFrequency.value = 'diaria'
    newCustomDays.value = []
    newWeeklyTarget.value = '3'
    showForm.value = false
    await refresh()
  } catch (err) {
    formError.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Não foi possível criar o hábito.'
  } finally {
    creating.value = false
  }
}

async function resume(id: string) {
  await setHabitStatus(id, 'ativo')
  await refresh()
}

// Pausar é um mini-fluxo próprio (docs seção 6, "férias com data"): o botão de pausa abre um
// campo de data opcional em vez de pausar na hora, já que sem data o hábito fica parado até
// alguém lembrar de retomar na mão.
const pausingHabitId = ref<string | null>(null)
const pauseUntilDraft = ref('')
const pausing = ref(false)

function startPausing(id: string) {
  pausingHabitId.value = id
  pauseUntilDraft.value = ''
}

function cancelPausing() {
  pausingHabitId.value = null
}

async function confirmPause(id: string) {
  pausing.value = true
  try {
    await setHabitStatus(id, 'pausado', pauseUntilDraft.value || null)
    pausingHabitId.value = null
    await refresh()
  } finally {
    pausing.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">Seus hábitos</h1>
        <p class="text-muted-foreground">{{ habits?.length ?? 0 }} hábitos cadastrados</p>
      </div>
      <Button class="rounded-full" @click="showForm = !showForm">
        <component :is="showForm ? X : Plus" :size="16" />
        {{ showForm ? 'Cancelar' : 'Novo hábito' }}
      </Button>
    </div>

    <div v-if="showForm" class="glass-panel space-y-4 p-5">
      <div class="grid gap-3 sm:grid-cols-3">
        <Input v-model="newName" placeholder="Nome do hábito" class="sm:col-span-3" />

        <Select v-model="newCategory">
          <SelectTrigger>
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="c in categories" :key="c" :value="c">{{ categoryLabel[c] }}</SelectItem>
          </SelectContent>
        </Select>

        <Select v-model="newDifficulty">
          <SelectTrigger>
            <SelectValue placeholder="Dificuldade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="d in difficulties" :key="d" :value="d">{{ difficultyLabel[d] }} · {{ DIFFICULTY_XP[d] }} XP</SelectItem>
          </SelectContent>
        </Select>

        <div class="flex flex-wrap items-center gap-2 sm:col-span-3">
          <button
            type="button"
            class="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
            :class="newFrequency === 'diaria' ? 'bg-primary text-primary-foreground' : 'glass-inset text-muted-foreground'"
            @click="newFrequency = 'diaria'"
          >
            Todo dia
          </button>
          <button
            type="button"
            class="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
            :class="newFrequency === 'dias_customizados' ? 'bg-primary text-primary-foreground' : 'glass-inset text-muted-foreground'"
            @click="newFrequency = 'dias_customizados'"
          >
            Dias específicos
          </button>
          <button
            type="button"
            class="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
            :class="newFrequency === 'semanal' ? 'bg-primary text-primary-foreground' : 'glass-inset text-muted-foreground'"
            @click="newFrequency = 'semanal'"
          >
            N vezes por semana
          </button>
        </div>
        <div v-if="newFrequency === 'dias_customizados'" class="flex flex-wrap gap-1.5 sm:col-span-3">
          <button
            v-for="(label, i) in WEEKDAY_LABELS"
            :key="i"
            type="button"
            class="h-9 w-9 rounded-full text-xs font-semibold transition-colors"
            :class="newCustomDays.includes(i) ? 'bg-primary text-primary-foreground' : 'glass-inset text-muted-foreground'"
            @click="toggleNewDay(i)"
          >
            {{ label }}
          </button>
        </div>
        <div v-if="newFrequency === 'semanal'" class="flex items-center gap-2 sm:col-span-3">
          <span class="text-sm text-muted-foreground">Quantas vezes por semana?</span>
          <Select v-model="newWeeklyTarget">
            <SelectTrigger class="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="n in weeklyTargetOptions" :key="n" :value="n">{{ n }}×</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button :disabled="creating" class="sm:col-span-3" @click="submitNewHabit">{{ creating ? 'Criando…' : 'Criar hábito' }}</Button>
      </div>
      <p v-if="formError" class="text-sm text-destructive">{{ formError }}</p>
    </div>

    <div class="glass-panel divide-y divide-white/5 p-2">
      <div
        v-for="habit in habits"
        :key="habit.id"
        class="flex flex-wrap items-center gap-4 rounded-2xl p-4 transition-colors hover:bg-white/[0.03]"
        :class="{ 'opacity-50': habit.status === 'pausado' }"
      >
        <div class="min-w-0 flex-1">
          <p class="font-medium">{{ habit.name }}</p>
          <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge :variant="habit.category">{{ categoryLabel[habit.category] }}</Badge>
            <Badge variant="secondary">{{ difficultyLabel[habit.difficulty] }} · {{ DIFFICULTY_XP[habit.difficulty] }} XP</Badge>
            <Badge v-if="habit.frequency === 'dias_customizados'" variant="secondary">{{ customDaysLabel(habit.customDays) }}</Badge>
            <Badge v-if="habit.frequency === 'semanal'" variant="secondary">
              {{ habit.weeklyProgress ?? 0 }}/{{ habit.weeklyTarget }}× essa semana
            </Badge>
            <Badge v-if="habit.status === 'pausado' && habit.pausedUntil" variant="secondary">
              Volta em {{ habit.pausedUntil.split('-').reverse().join('/') }}
            </Badge>
            <Badge v-if="habit.dominatedAt" variant="warning" class="inline-flex items-center gap-1">
              <Crown :size="10" /> Dominado
            </Badge>
          </div>

          <div v-if="pausingHabitId === habit.id" class="mt-3 flex flex-wrap items-center gap-2">
            <Input v-model="pauseUntilDraft" type="date" class="h-8 w-40 py-1" />
            <span class="text-xs text-muted-foreground">(opcional — vazio pausa indefinidamente)</span>
            <Button size="sm" class="h-8 rounded-full" :disabled="pausing" @click="confirmPause(habit.id)">
              {{ pausing ? 'Pausando…' : 'Confirmar pausa' }}
            </Button>
            <Button size="sm" variant="ghost" class="h-8 rounded-full" :disabled="pausing" @click="cancelPausing">Cancelar</Button>
          </div>
        </div>

        <div class="flex items-center gap-1.5 text-sm text-orange-400">
          <Flame :size="16" /> {{ habit.streakCount }}
        </div>
        <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Trophy :size="16" /> {{ habit.longestStreak }}
        </div>

        <Button
          v-if="habit.status === 'ativo'"
          variant="ghost"
          size="icon"
          class="rounded-full"
          title="Pausar"
          @click="startPausing(habit.id)"
        >
          <Pause :size="16" />
        </Button>
        <Button v-else variant="ghost" size="icon" class="rounded-full" title="Retomar" @click="resume(habit.id)">
          <Play :size="16" />
        </Button>
      </div>

      <p v-if="!habits?.length" class="p-6 text-center text-sm text-muted-foreground">Nenhum hábito ainda. Crie o primeiro acima.</p>
    </div>
  </div>
</template>

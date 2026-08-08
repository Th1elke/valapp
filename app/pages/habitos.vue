<script setup lang="ts">
import { Crown, Flame, Pause, Play, Plus, Trophy, X } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DIFFICULTY_XP } from '#shared/gamification'
import { categoryLabel, difficultyLabel, type HabitCategory, type HabitDifficulty } from '#shared/types'

const { data: habits, refresh } = useHabits()

const categories = Object.keys(categoryLabel) as HabitCategory[]
const difficulties = Object.keys(difficultyLabel) as HabitDifficulty[]

const showForm = ref(false)
const newName = ref('')
const newCategory = ref<HabitCategory>('fisico')
const newDifficulty = ref<HabitDifficulty>('facil')
const creating = ref(false)
const formError = ref('')

async function submitNewHabit() {
  if (!newName.value.trim()) {
    formError.value = 'Dê um nome para o hábito.'
    return
  }
  creating.value = true
  formError.value = ''
  try {
    await createHabit({ name: newName.value, category: newCategory.value, difficulty: newDifficulty.value })
    newName.value = ''
    newCategory.value = 'fisico'
    newDifficulty.value = 'facil'
    showForm.value = false
    await refresh()
  } catch (err) {
    formError.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Não foi possível criar o hábito.'
  } finally {
    creating.value = false
  }
}

async function toggleStatus(id: string, status: 'ativo' | 'pausado') {
  await setHabitStatus(id, status === 'ativo' ? 'pausado' : 'ativo')
  await refresh()
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

        <Button :disabled="creating" @click="submitNewHabit">{{ creating ? 'Criando…' : 'Criar hábito' }}</Button>
      </div>
      <p v-if="formError" class="text-sm text-red-400">{{ formError }}</p>
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
            <Badge v-if="habit.dominatedAt" variant="warning" class="inline-flex items-center gap-1">
              <Crown :size="10" /> Dominado
            </Badge>
          </div>
        </div>

        <div class="flex items-center gap-1.5 text-sm text-orange-400">
          <Flame :size="16" /> {{ habit.streakCount }}
        </div>
        <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Trophy :size="16" /> {{ habit.longestStreak }}
        </div>

        <Button variant="ghost" size="icon" class="rounded-full" @click="toggleStatus(habit.id, habit.status as 'ativo' | 'pausado')">
          <Pause v-if="habit.status === 'ativo'" :size="16" />
          <Play v-else :size="16" />
        </Button>
      </div>

      <p v-if="!habits?.length" class="p-6 text-center text-sm text-muted-foreground">Nenhum hábito ainda. Crie o primeiro acima.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Check, Clock, Coins, Plus, Sparkles, Trash2, X } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDateStr, todayStr } from '#shared/date'
import { missionGoldReward, missionXpReward } from '#shared/gamification'
import { categoryLabel, difficultyLabel, type HabitCategory, type HabitDifficulty } from '#shared/types'

const { data: missions, refresh } = useMissions()
const { refresh: refreshUser } = useUserState()

const difficulties = Object.keys(difficultyLabel) as HabitDifficulty[]
const categories = Object.keys(categoryLabel) as HabitCategory[]

const activeMissions = computed(() => missions.value?.filter((m) => m.status === 'ativa') ?? [])
const standbyMissions = computed(() => missions.value?.filter((m) => m.status === 'standby') ?? [])

const showForm = ref(false)
const newTitle = ref('')
const newDescription = ref('')
const newCategory = ref<HabitCategory | 'nenhuma'>('nenhuma')
const newDifficulty = ref<HabitDifficulty | 'depois'>('depois')
const newDeadline = ref('')
const noDeadline = ref(true)
const creating = ref(false)
const formError = ref('')
const completingId = ref<string | null>(null)
const lastReward = ref<{ xp: number; gold: number } | null>(null)
const standbyPicks = ref<Record<string, HabitDifficulty | ''>>({})
const settingDifficultyId = ref<string | null>(null)

const todayInputMin = new Date().toISOString().slice(0, 10)

async function submitNewMission() {
  if (!newTitle.value.trim()) {
    formError.value = 'Dê um título para a missão.'
    return
  }
  creating.value = true
  formError.value = ''
  try {
    await createMission({
      title: newTitle.value,
      description: newDescription.value,
      category: newCategory.value === 'nenhuma' ? null : newCategory.value,
      difficulty: newDifficulty.value === 'depois' ? null : newDifficulty.value,
      deadline: noDeadline.value ? null : newDeadline.value || null,
    })
    newTitle.value = ''
    newDescription.value = ''
    newCategory.value = 'nenhuma'
    newDifficulty.value = 'depois'
    newDeadline.value = ''
    noDeadline.value = true
    showForm.value = false
    await refresh()
  } catch (err) {
    formError.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Não foi possível criar a missão.'
  } finally {
    creating.value = false
  }
}

function isOverdue(deadline: string) {
  return deadline < todayStr()
}

async function confirmDifficulty(id: string) {
  const difficulty = standbyPicks.value[id]
  if (!difficulty) return
  settingDifficultyId.value = id
  try {
    await updateMissionDifficulty(id, difficulty)
    await refresh()
  } finally {
    settingDifficultyId.value = null
  }
}

async function complete(id: string) {
  completingId.value = id
  try {
    const result = await completeMission(id)
    lastReward.value = { xp: result.xp, gold: result.gold }
    await Promise.all([refresh(), refreshUser()])
  } finally {
    completingId.value = null
  }
}

async function cancel(id: string) {
  await cancelMission(id)
  await refresh()
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">Missões</h1>
        <p class="text-muted-foreground">Tarefas pontuais — valem 3× mais XP e ouro, mas somem depois de concluídas</p>
      </div>
      <Button class="rounded-full" @click="showForm = !showForm">
        <component :is="showForm ? X : Plus" :size="16" />
        {{ showForm ? 'Cancelar' : 'Nova missão' }}
      </Button>
    </div>

    <div v-if="showForm" class="glass-panel space-y-4 p-5">
      <div class="grid gap-3 sm:grid-cols-3">
        <Input v-model="newTitle" placeholder="Título da missão" class="sm:col-span-3" />
        <Input v-model="newDescription" placeholder="Descrição (opcional)" class="sm:col-span-2" />
        <Select v-model="newDifficulty">
          <SelectTrigger>
            <SelectValue placeholder="Dificuldade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="depois">Decidir depois</SelectItem>
            <SelectItem v-for="d in difficulties" :key="d" :value="d">
              {{ difficultyLabel[d] }} · {{ missionXpReward(d) }} XP · {{ missionGoldReward(d) }} ouro
            </SelectItem>
          </SelectContent>
        </Select>

        <Select v-model="newCategory">
          <SelectTrigger>
            <SelectValue placeholder="Categoria (opcional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nenhuma">Sem categoria</SelectItem>
            <SelectItem v-for="c in categories" :key="c" :value="c">{{ categoryLabel[c] }}</SelectItem>
          </SelectContent>
        </Select>

        <div class="flex flex-wrap items-center gap-3 sm:col-span-3">
          <label class="flex items-center gap-2 text-sm text-muted-foreground">
            <input v-model="noDeadline" type="checkbox" class="rounded border-white/20" />
            Sem prazo
          </label>
          <Input v-if="!noDeadline" v-model="newDeadline" type="date" :min="todayInputMin" class="w-auto" />
        </div>

        <Button :disabled="creating" class="sm:col-span-3" @click="submitNewMission">
          {{ creating ? 'Criando…' : 'Criar missão' }}
        </Button>
      </div>
      <p v-if="formError" class="text-sm text-red-400">{{ formError }}</p>
    </div>

    <p v-if="lastReward" class="glass-inset flex items-center gap-2 rounded-2xl p-3 text-sm text-emerald-400">
      <Sparkles :size="16" /> Missão concluída! +{{ lastReward.xp }} XP · +{{ lastReward.gold }} ouro
    </p>

    <div v-if="standbyMissions.length" class="glass-panel divide-y divide-white/5 p-2">
      <p class="px-4 pt-2 text-sm font-medium text-muted-foreground">Pendentes — defina a dificuldade</p>
      <div v-for="mission in standbyMissions" :key="mission.id" class="flex flex-wrap items-center gap-4 rounded-2xl p-4 hover:bg-white/[0.03]">
        <div class="min-w-0 flex-1">
          <p class="font-medium">{{ mission.title }}</p>
          <ExpandableText v-if="mission.description" :text="mission.description" />
          <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge v-if="mission.category" :variant="mission.category">{{ categoryLabel[mission.category] }}</Badge>
            <Badge variant="secondary">Pendente</Badge>
            <Badge v-if="mission.deadline" :variant="isOverdue(mission.deadline) ? 'danger' : 'secondary'" class="flex items-center gap-1">
              <Clock :size="10" /> {{ isOverdue(mission.deadline) ? 'Atrasada' : formatDateStr(mission.deadline) }}
            </Badge>
          </div>
        </div>

        <Select v-model="standbyPicks[mission.id]">
          <SelectTrigger class="w-40">
            <SelectValue placeholder="Dificuldade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="d in difficulties" :key="d" :value="d">
              {{ difficultyLabel[d] }} · {{ missionXpReward(d) }} XP · {{ missionGoldReward(d) }} ouro
            </SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          class="rounded-full"
          :disabled="!standbyPicks[mission.id] || settingDifficultyId === mission.id"
          @click="confirmDifficulty(mission.id)"
        >
          <Check :size="14" /> Confirmar
        </Button>
        <Button variant="ghost" size="icon" class="rounded-full text-muted-foreground" title="Cancelar missão" @click="cancel(mission.id)">
          <Trash2 :size="16" />
        </Button>
      </div>
    </div>

    <div class="glass-panel divide-y divide-white/5 p-2">
      <div v-for="mission in activeMissions" :key="mission.id" class="flex flex-wrap items-center gap-4 rounded-2xl p-4 hover:bg-white/[0.03]">
        <div class="min-w-0 flex-1">
          <p class="font-medium">{{ mission.title }}</p>
          <ExpandableText v-if="mission.description" :text="mission.description" />
          <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge v-if="mission.category" :variant="mission.category">{{ categoryLabel[mission.category] }}</Badge>
            <Badge variant="secondary">{{ difficultyLabel[mission.difficulty!] }}</Badge>
            <Badge variant="warning">+{{ mission.xpReward }} XP</Badge>
            <Badge variant="warning" class="flex items-center gap-1">
              <Coins :size="10" /> +{{ mission.goldReward }}
            </Badge>
            <Badge v-if="mission.deadline" :variant="isOverdue(mission.deadline) ? 'danger' : 'secondary'" class="flex items-center gap-1">
              <Clock :size="10" /> {{ isOverdue(mission.deadline) ? 'Atrasada' : formatDateStr(mission.deadline) }}
            </Badge>
          </div>
        </div>

        <Button size="sm" class="rounded-full" :disabled="completingId === mission.id" @click="complete(mission.id)">
          <Check :size="14" /> Concluir
        </Button>
        <Button variant="ghost" size="icon" class="rounded-full text-muted-foreground" title="Cancelar missão" @click="cancel(mission.id)">
          <Trash2 :size="16" />
        </Button>
      </div>

      <p v-if="!activeMissions.length && !standbyMissions.length" class="p-6 text-center text-sm text-muted-foreground">
        Nenhuma missão ativa. Crie uma tarefa pontual acima.
      </p>
    </div>
  </div>
</template>

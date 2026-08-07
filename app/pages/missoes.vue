<script setup lang="ts">
import { Check, Coins, Plus, Sparkles, Trash2, X } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { missionGoldReward, missionXpReward } from '#shared/gamification'
import { difficultyLabel, type HabitDifficulty } from '#shared/types'

const { data: missions, refresh } = useMissions()
const { refresh: refreshUser } = useUserState()

const difficulties = Object.keys(difficultyLabel) as HabitDifficulty[]

const showForm = ref(false)
const newTitle = ref('')
const newDescription = ref('')
const newDifficulty = ref<HabitDifficulty>('facil')
const creating = ref(false)
const formError = ref('')
const completingId = ref<string | null>(null)
const lastReward = ref<{ xp: number; gold: number } | null>(null)

async function submitNewMission() {
  if (!newTitle.value.trim()) {
    formError.value = 'Dê um título para a missão.'
    return
  }
  creating.value = true
  formError.value = ''
  try {
    await createMission({ title: newTitle.value, description: newDescription.value, difficulty: newDifficulty.value })
    newTitle.value = ''
    newDescription.value = ''
    newDifficulty.value = 'facil'
    showForm.value = false
    await refresh()
  } catch (err) {
    formError.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Não foi possível criar a missão.'
  } finally {
    creating.value = false
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
            <SelectItem v-for="d in difficulties" :key="d" :value="d">
              {{ difficultyLabel[d] }} · {{ missionXpReward(d) }} XP · {{ missionGoldReward(d) }} ouro
            </SelectItem>
          </SelectContent>
        </Select>
        <Button :disabled="creating" class="sm:col-span-3" @click="submitNewMission">
          {{ creating ? 'Criando…' : 'Criar missão' }}
        </Button>
      </div>
      <p v-if="formError" class="text-sm text-red-400">{{ formError }}</p>
    </div>

    <p v-if="lastReward" class="glass-inset flex items-center gap-2 rounded-2xl p-3 text-sm text-emerald-400">
      <Sparkles :size="16" /> Missão concluída! +{{ lastReward.xp }} XP · +{{ lastReward.gold }} ouro
    </p>

    <div class="glass-panel divide-y divide-white/5 p-2">
      <div v-for="mission in missions" :key="mission.id" class="flex flex-wrap items-center gap-4 rounded-2xl p-4 hover:bg-white/[0.03]">
        <div class="min-w-0 flex-1">
          <p class="font-medium">{{ mission.title }}</p>
          <p v-if="mission.description" class="text-sm text-muted-foreground">{{ mission.description }}</p>
          <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">{{ difficultyLabel[mission.difficulty] }}</Badge>
            <Badge variant="warning">+{{ mission.xpReward }} XP</Badge>
            <Badge variant="warning" class="flex items-center gap-1">
              <Coins :size="10" /> +{{ mission.goldReward }}
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

      <p v-if="!missions?.length" class="p-6 text-center text-sm text-muted-foreground">
        Nenhuma missão ativa. Crie uma tarefa pontual acima.
      </p>
    </div>
  </div>
</template>

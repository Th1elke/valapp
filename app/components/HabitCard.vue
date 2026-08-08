<script setup lang="ts">
import { Check, Crown, Flame, Pause } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { DIFFICULTY_XP } from '#shared/gamification'
import { categoryLabel, difficultyLabel, type HabitDTO } from '#shared/types'

const props = defineProps<{ habit: HabitDTO }>()
const emit = defineEmits<{ toggle: [id: string] }>()
</script>

<template>
  <div
    class="glass-inset glass-panel-hover flex items-center gap-4 rounded-2xl p-4"
    :class="{ 'opacity-50': props.habit.status === 'pausado' }"
  >
    <button
      type="button"
      :disabled="props.habit.status === 'pausado'"
      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors"
      :class="
        props.habit.doneToday
          ? 'border-transparent bg-gradient-to-br from-primary to-primary/50 text-white'
          : 'border-white/15 bg-white/5 text-transparent hover:border-white/30'
      "
      @click="emit('toggle', props.habit.id)"
    >
      <Check :size="18" />
    </button>

    <div class="min-w-0 flex-1">
      <p class="truncate font-medium">{{ props.habit.name }}</p>
      <div class="mt-1 flex flex-wrap items-center gap-1.5">
        <Badge :variant="props.habit.category">{{ categoryLabel[props.habit.category] }}</Badge>
        <Badge variant="secondary">{{ difficultyLabel[props.habit.difficulty] }} · {{ DIFFICULTY_XP[props.habit.difficulty] }} XP</Badge>
        <Badge v-if="props.habit.dominatedAt" variant="warning" class="inline-flex items-center gap-1">
          <Crown :size="10" /> Dominado
        </Badge>
        <span v-if="props.habit.status === 'pausado'" class="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Pause :size="12" /> Pausado
        </span>
      </div>
    </div>

    <div class="flex shrink-0 items-center gap-1 text-sm font-semibold text-orange-400">
      <Flame :size="16" />
      {{ props.habit.streakCount }}
    </div>
  </div>
</template>

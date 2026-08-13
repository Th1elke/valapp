<script setup lang="ts">
import { Award, Sparkles } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { getClassInfo } from '#shared/gamification'

const { data: user } = useUserState()

const classInfo = computed(() => (user.value?.playerClass ? getClassInfo(user.value.playerClass, user.value.level) : null))

const milestones = computed(() => [
  { level: 5, label: 'Escolha de classe', icon: Sparkles },
  {
    level: 15,
    label: user.value?.playerClass ? `Sub-evolução (${getClassInfo(user.value.playerClass, 15).label})` : 'Sub-evolução',
    icon: Award,
  },
  {
    level: 30,
    label: user.value?.playerClass ? `Sub-evolução máxima (${getClassInfo(user.value.playerClass, 30).label})` : 'Sub-evolução máxima',
    icon: Award,
  },
])
</script>

<template>
  <div v-if="user" class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold">Evolução</h1>
      <p class="text-muted-foreground">Sua árvore de habilidades e os marcos de progressão da classe</p>
    </div>

    <div v-if="user.playerClass" class="glass-panel p-5">
      <SkillTree />
    </div>
    <p v-else class="glass-panel p-6 text-center text-sm text-muted-foreground">
      Escolha uma classe no Perfil ao chegar no nível 5 para desbloquear a árvore de habilidades.
    </p>

    <div class="glass-panel p-5">
      <h2 class="mb-4 font-semibold">Marcos de classe</h2>
      <div class="space-y-3">
        <div
          v-for="milestone in milestones"
          :key="milestone.level"
          class="flex items-center gap-3 rounded-2xl p-3"
          :class="user.level >= milestone.level ? 'glass-inset' : 'opacity-40'"
        >
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br"
            :class="classInfo?.gradient ?? 'from-primary to-primary/50'"
          >
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
<script setup lang="ts">
import { Check, Lock, Sparkles, Star } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { ROOT_PASSIVES, SKILLS, getPrerequisiteSkillId, type Skill } from '#shared/skills'

const { data: user, refresh: refreshUser } = useUserState()

const unlocking = ref<string | null>(null)
const error = ref('')

const rootPassive = computed(() => (user.value?.playerClass ? ROOT_PASSIVES[user.value.playerClass] : null))

const paths = computed(() => {
  if (!user.value?.playerClass) return []
  const classSkills = SKILLS.filter((s) => s.playerClass === user.value!.playerClass)
  const pathIds = [...new Set(classSkills.map((s) => s.path))]
  return pathIds.map((path) => ({
    path,
    label: classSkills.find((s) => s.path === path)!.pathLabel,
    skills: classSkills.filter((s) => s.path === path).sort((a, b) => a.tier - b.tier),
  }))
})

function state(skill: Skill): 'owned' | 'locked' | 'available' {
  if (!user.value) return 'locked'
  if (user.value.unlockedSkills.includes(skill.id)) return 'owned'
  const prereq = getPrerequisiteSkillId(skill)
  if (prereq && !user.value.unlockedSkills.includes(prereq)) return 'locked'
  if (user.value.availableSkillPoints < skill.cost) return 'locked'
  return 'available'
}

async function unlock(skill: Skill) {
  if (state(skill) !== 'available') return
  unlocking.value = skill.id
  error.value = ''
  try {
    await unlockSkill(skill.id)
    await refreshUser()
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Não foi possível desbloquear essa habilidade.'
  } finally {
    unlocking.value = null
  }
}
</script>

<template>
  <div v-if="user?.playerClass" class="space-y-5">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="font-semibold">Árvore de Habilidades</h2>
        <p class="text-sm text-muted-foreground">1 SP a cada nível a partir do 5 — gaste nos dois caminhos livremente</p>
      </div>
      <Badge variant="success">{{ user.availableSkillPoints }} SP disponíveis</Badge>
    </div>

    <div v-if="rootPassive" class="glass-inset flex items-center gap-3 rounded-2xl p-3">
      <div class="glow-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/50">
        <Sparkles :size="16" class="text-white" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium">{{ rootPassive.name }} <span class="text-xs text-muted-foreground">(passiva de classe)</span></p>
        <p class="text-xs text-muted-foreground">{{ rootPassive.description }}</p>
      </div>
    </div>

    <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

    <div class="grid gap-8 sm:grid-cols-2">
      <div v-for="group in paths" :key="group.path">
        <h3 class="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground">{{ group.label }}</h3>
        <div class="flex flex-col items-center">
          <template v-for="(skill, i) in group.skills" :key="skill.id">
            <div v-if="i > 0" class="h-6 w-0.5 shrink-0" :class="state(group.skills[i - 1]) !== 'locked' ? 'bg-primary/60' : 'bg-white/10'" />
            <div class="flex w-full max-w-[220px] flex-col items-center gap-2 pb-6 text-center last:pb-0">
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition-all"
                :class="[
                  state(skill) === 'owned' ? 'glow-primary border-primary bg-primary text-white' : '',
                  state(skill) === 'available' ? 'glow-primary animate-pulse border-primary/60 text-primary' : '',
                  state(skill) === 'locked' ? 'border-white/10 text-muted-foreground/40 grayscale' : '',
                ]"
              >
                <Check v-if="state(skill) === 'owned'" :size="20" />
                <Lock v-else-if="state(skill) === 'locked'" :size="16" />
                <Star v-else :size="18" />
              </div>
              <div>
                <p class="text-sm font-medium">{{ skill.name }}</p>
                <p class="mt-0.5 text-xs text-muted-foreground">{{ skill.description }}</p>
              </div>
              <Badge v-if="state(skill) !== 'owned'" variant="secondary">{{ skill.cost }} SP</Badge>
              <button
                v-if="state(skill) === 'available'"
                type="button"
                :disabled="unlocking === skill.id"
                class="w-full rounded-xl bg-primary/20 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/30 disabled:opacity-50"
                @click="unlock(skill)"
              >
                {{ unlocking === skill.id ? 'Desbloqueando…' : 'Desbloquear' }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
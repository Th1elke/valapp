<script setup lang="ts">
import { Check, Lock, Sparkles } from 'lucide-vue-next'
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
      <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/50">
        <Sparkles :size="16" class="text-white" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium">{{ rootPassive.name }} <span class="text-xs text-muted-foreground">(passiva de classe)</span></p>
        <p class="text-xs text-muted-foreground">{{ rootPassive.description }}</p>
      </div>
    </div>

    <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

    <div class="grid gap-4 md:grid-cols-2">
      <div v-for="group in paths" :key="group.path" class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground">{{ group.label }}</h3>
        <div class="space-y-2">
          <div
            v-for="skill in group.skills"
            :key="skill.id"
            class="glass-inset rounded-2xl border p-3"
            :class="{
              'border-primary': state(skill) === 'owned',
              'border-white/5 opacity-50': state(skill) === 'locked',
              'border-white/10': state(skill) === 'available',
            }"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="flex items-center gap-1.5 text-sm font-medium">
                  <Check v-if="state(skill) === 'owned'" :size="14" class="shrink-0 text-emerald-400" />
                  <Lock v-else-if="state(skill) === 'locked'" :size="14" class="shrink-0 text-muted-foreground" />
                  {{ skill.name }}
                </p>
                <p class="mt-1 text-xs text-muted-foreground">{{ skill.description }}</p>
              </div>
              <Badge v-if="state(skill) !== 'owned'" variant="secondary" class="shrink-0">{{ skill.cost }} SP</Badge>
            </div>
            <button
              v-if="state(skill) === 'available'"
              type="button"
              :disabled="unlocking === skill.id"
              class="mt-2 w-full rounded-xl bg-primary/20 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/30 disabled:opacity-50"
              @click="unlock(skill)"
            >
              {{ unlocking === skill.id ? 'Desbloqueando…' : 'Desbloquear' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

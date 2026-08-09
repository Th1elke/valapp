<script setup lang="ts">
import { Award, Camera, Coins, Flame, Heart, Music2, Shield, Sparkles, Sword, Target, VenetianMask, Wand2 } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BORDERS, THEMES, TITLES, type CosmeticCategory } from '#shared/cosmetics'
import { getMaxShields } from '#shared/economy'
import { CLASS_CHANGE_COOLDOWN_DAYS, CLASS_CHANGE_XP_COST_PERCENT, getClassInfo } from '#shared/gamification'
import type { PlayerClass, ShieldTargetType } from '#shared/types'

const { data: user, refresh: refreshUser } = useUserState()
const { data: habits } = useHabits()
const { data: stats } = useAttributeStats()

const classInfo = computed(() => (user.value ? getClassInfo(user.value.playerClass, user.value.level) : null))
const maxShields = computed(() => getMaxShields(user.value?.unlockedSkills ?? []))
const equippedTitleName = computed(() => TITLES.find((t) => t.id === user.value?.equippedTitle)?.name ?? null)

const cosmeticGroups: { category: CosmeticCategory; label: string; items: typeof TITLES }[] = [
  { category: 'titulo', label: 'Títulos', items: TITLES },
  { category: 'borda', label: 'Bordas de Avatar', items: BORDERS },
  { category: 'tema', label: 'Temas de Cor', items: THEMES },
]
const equipping = ref<string | null>(null)
const cosmeticError = ref('')

function isEquipped(category: CosmeticCategory, id: string) {
  if (!user.value) return false
  if (category === 'titulo') return user.value.equippedTitle === id
  if (category === 'borda') return user.value.equippedAvatarBorder === id
  return user.value.equippedTheme === id
}

async function toggleEquip(category: CosmeticCategory, id: string) {
  equipping.value = id
  cosmeticError.value = ''
  try {
    await equipCosmetic(category, isEquipped(category, id) ? null : id)
    await refreshUser()
  } catch (err) {
    cosmeticError.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Não foi possível equipar.'
  } finally {
    equipping.value = null
  }
}
const avatarInput = ref<HTMLInputElement | null>(null)
const uploadingAvatar = ref(false)
const avatarError = ref('')

async function onAvatarSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploadingAvatar.value = true
  avatarError.value = ''
  try {
    await uploadAvatar(file)
    await refreshUser()
  } catch (err) {
    avatarError.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Não foi possível enviar a foto.'
  } finally {
    uploadingAvatar.value = false
    if (avatarInput.value) avatarInput.value.value = ''
  }
}

const coverInput = ref<HTMLInputElement | null>(null)
const uploadingCover = ref(false)
const coverError = ref('')

async function onCoverSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploadingCover.value = true
  coverError.value = ''
  try {
    await uploadCover(file)
    await refreshUser()
  } catch (err) {
    coverError.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Não foi possível enviar a capa.'
  } finally {
    uploadingCover.value = false
    if (coverInput.value) coverInput.value.value = ''
  }
}

const xpIntoLevel = computed(() => (user.value ? user.value.xp - user.value.xpFloor : 0))
const xpNeeded = computed(() => (user.value ? Math.max(1, user.value.xpCeil - user.value.xpFloor) : 1))
const longestStreak = computed(() => Math.max(0, ...(habits.value ?? []).map((h) => h.longestStreak)))

const canChooseClass = computed(() => !!user.value && user.value.level >= 5 && !user.value.playerClass)
const choosing = ref(false)
const classOptions: { value: PlayerClass; label: string; icon: typeof Sword; description: string }[] = [
  { value: 'guerreiro', label: 'Guerreiro', icon: Sword, description: '+15% XP em hábitos Físicos' },
  { value: 'mago', label: 'Mago', icon: Wand2, description: '+15% XP em hábitos de Mente' },
  { value: 'paladino', label: 'Paladino', icon: Shield, description: 'Reduz perda de HP em 50%' },
  { value: 'arqueiro', label: 'Arqueiro', icon: Target, description: 'Bônus fixo de XP a cada 5º check-in em sequência' },
  { value: 'ladino', label: 'Ladino', icon: VenetianMask, description: 'Chance de XP em dobro em check-ins de Criatividade' },
  { value: 'bardo', label: 'Bardo', icon: Music2, description: 'Sequência quebrada em hábito Social vira metade, não zero' },
]

async function pickClass(playerClass: PlayerClass) {
  choosing.value = true
  try {
    await chooseClass(playerClass)
    await refreshUser()
  } finally {
    choosing.value = false
  }
}

// Escudo (docs 5.2): protege o dia de hoje inteiro, ou a sequência de um hábito específico.
const shieldTargetType = ref<ShieldTargetType>('protecao_dia')
const shieldHabitId = ref('')
const usingShield = ref(false)
const shieldError = ref('')
const shieldSuccess = ref('')
const activeHabitsForShield = computed(() => (habits.value ?? []).filter((h) => h.status === 'ativo'))

async function activateShield() {
  if (shieldTargetType.value === 'protecao_streak' && !shieldHabitId.value) {
    shieldError.value = 'Escolha um hábito para proteger.'
    return
  }
  usingShield.value = true
  shieldError.value = ''
  shieldSuccess.value = ''
  try {
    await useShield(shieldTargetType.value, { habitId: shieldHabitId.value || undefined })
    await refreshUser()
    shieldSuccess.value =
      shieldTargetType.value === 'protecao_dia'
        ? 'Escudo ativado — hoje não perde HP se algum hábito ficar pendente.'
        : 'Escudo ativado — a sequência desse hábito fica protegida hoje.'
    shieldHabitId.value = ''
  } catch (err) {
    shieldError.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Não foi possível usar o escudo.'
  } finally {
    usingShield.value = false
  }
}

// Troca de classe (docs seção 4.3): 1x a cada 90 dias, custando 30% do XP atual.
const otherClassOptions = computed(() => classOptions.filter((o) => o.value !== user.value?.playerClass))
const classChangeCooldownDaysLeft = computed(() => {
  if (!user.value) return 0
  const lastChange = user.value.lastClassChangeAt ?? user.value.classChosenAt
  if (!lastChange) return 0
  const daysSince = (Date.now() - new Date(lastChange).getTime()) / 86400000
  return Math.max(0, Math.ceil(CLASS_CHANGE_COOLDOWN_DAYS - daysSince))
})
const canChangeClass = computed(() => !!user.value?.playerClass && classChangeCooldownDaysLeft.value === 0)
const classChangeCost = computed(() => (user.value ? Math.round(user.value.xp * CLASS_CHANGE_XP_COST_PERCENT) : 0))
const changingClass = ref(false)
const classChangeError = ref('')
const showClassChange = ref(false)

async function changeClass(playerClass: PlayerClass) {
  changingClass.value = true
  classChangeError.value = ''
  try {
    await chooseClass(playerClass)
    await refreshUser()
    showClassChange.value = false
  } catch (err) {
    classChangeError.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Não foi possível trocar de classe.'
  } finally {
    changingClass.value = false
  }
}

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
    <div class="hero-panel overflow-hidden pb-3 sm:pb-0">
      <div class="group relative h-28 sm:h-40">
        <img
          v-if="user.coverUrl"
          :src="user.coverUrl"
          alt=""
          class="h-full w-full object-cover [mask-image:linear-gradient(to_bottom,black_30%,transparent_92%)] [-webkit-mask-image:linear-gradient(to_bottom,black_30%,transparent_92%)]"
        />
        <template v-else>
          <div class="absolute inset-0 bg-gradient-to-r from-primary/40 to-transparent [mask-image:linear-gradient(to_bottom,black_30%,transparent_92%)] [-webkit-mask-image:linear-gradient(to_bottom,black_30%,transparent_92%)]" />
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,hsl(var(--primary)/0.45),transparent_65%)] [mask-image:linear-gradient(to_bottom,black_30%,transparent_92%)] [-webkit-mask-image:linear-gradient(to_bottom,black_30%,transparent_92%)]" />
        </template>
        <button
          type="button"
          :disabled="uploadingCover"
          title="Trocar capa"
          class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-100"
          @click="coverInput?.click()"
        >
          <span class="flex items-center gap-2 text-sm text-white">
            <Camera v-if="!uploadingCover" :size="18" />
            {{ uploadingCover ? 'Enviando…' : 'Trocar capa' }}
          </span>
        </button>
        <input ref="coverInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="hidden" @change="onCoverSelected" />

        <div class="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-3 p-3 sm:gap-4 sm:p-6">
          <div class="group/avatar pointer-events-auto relative z-10 shrink-0">
            <ClassAvatar
              :player-class="user.playerClass"
              :level="user.level"
              :border-id="user.equippedAvatarBorder"
              :avatar-url="user.avatarUrl"
              size="lg"
            />
            <button
              type="button"
              :disabled="uploadingAvatar"
              title="Trocar foto de perfil"
              class="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity group-hover/avatar:opacity-100 disabled:opacity-100"
              @click="avatarInput?.click()"
            >
              <Camera v-if="!uploadingAvatar" :size="22" class="text-white" />
              <span v-else class="text-xs text-white">Enviando…</span>
            </button>
            <input ref="avatarInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="hidden" @change="onAvatarSelected" />
          </div>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="truncate text-lg font-semibold text-white drop-shadow-md sm:text-2xl">{{ user.name }}</h1>
              <Badge>{{ classInfo?.label }}</Badge>
            </div>
            <p v-if="equippedTitleName" class="truncate text-xs font-medium text-amber-300 drop-shadow-md sm:text-sm">{{ equippedTitleName }}</p>
          </div>
        </div>
        <div class="pointer-events-none absolute inset-y-0 right-6 hidden w-52 items-center sm:flex">
          <div class="w-full">
            <p class="text-sm text-white drop-shadow-md">Nível {{ user.level }} · {{ user.xp }} XP total</p>
            <Progress :model-value="xpIntoLevel" :max="xpNeeded" class="mt-2 glow-primary" />
            <p class="mt-1 text-xs text-white/80 drop-shadow-md">{{ xpIntoLevel }} / {{ xpNeeded }} XP para o nível {{ user.level + 1 }}</p>
          </div>
        </div>
      </div>
      <div class="px-4 pt-3 sm:hidden">
        <p class="text-sm text-muted-foreground">Nível {{ user.level }} · {{ user.xp }} XP total</p>
        <Progress :model-value="xpIntoLevel" :max="xpNeeded" class="mt-2 glow-primary" />
        <p class="mt-1 text-xs text-muted-foreground">{{ xpIntoLevel }} / {{ xpNeeded }} XP para o nível {{ user.level + 1 }}</p>
      </div>
      <p v-if="coverError" class="px-4 pt-2 text-xs text-red-400 sm:px-6">{{ coverError }}</p>
      <p v-if="avatarError" class="px-4 pt-2 text-xs text-red-400 sm:px-6">{{ avatarError }}</p>
    </div>

    <div v-if="canChooseClass" class="glass-panel space-y-4 p-5">
      <h2 class="font-semibold">Escolha sua classe</h2>
      <div class="grid gap-3 sm:grid-cols-3">
        <button
          v-for="option in classOptions"
          :key="option.value"
          type="button"
          :disabled="choosing"
          class="glass-inset glass-panel-hover flex flex-col items-center gap-2 rounded-2xl p-4 text-center disabled:opacity-50"
          @click="pickClass(option.value)"
        >
          <component :is="option.icon" :size="24" />
          <p class="font-medium">{{ option.label }}</p>
          <p class="text-xs text-muted-foreground">{{ option.description }}</p>
        </button>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-4">
      <Card class="glass-panel border-0">
        <CardContent class="flex items-center gap-3 pt-6">
          <Heart :size="20" class="text-rose-400" />
          <div>
            <p class="text-xs text-muted-foreground">Vida atual</p>
            <p class="text-lg font-semibold">{{ user.hp }} / 100</p>
          </div>
        </CardContent>
      </Card>
      <Card class="glass-panel border-0">
        <CardContent class="flex items-center gap-3 pt-6">
          <Coins :size="20" class="text-amber-400" />
          <div>
            <p class="text-xs text-muted-foreground">Ouro</p>
            <p class="text-lg font-semibold">{{ user.gold }}</p>
          </div>
        </CardContent>
      </Card>
      <Card class="glass-panel border-0">
        <CardContent class="flex items-center gap-3 pt-6">
          <Flame :size="20" class="text-orange-400" />
          <div>
            <p class="text-xs text-muted-foreground">Maior sequência</p>
            <p class="text-lg font-semibold">{{ longestStreak }} dias</p>
          </div>
        </CardContent>
      </Card>
      <Card class="glass-panel border-0">
        <CardContent class="flex items-center gap-3 pt-6">
          <Shield :size="20" class="text-violet-400" />
          <div>
            <p class="text-xs text-muted-foreground">Escudos disponíveis</p>
            <p class="text-lg font-semibold">{{ user.shieldsRemaining }} / {{ maxShields }}</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="glass-panel space-y-4 p-5">
      <div>
        <h2 class="font-semibold">Usar escudo</h2>
        <p class="text-sm text-muted-foreground">
          Protege antes do fechamento do dia: cancela a perda de HP do dia inteiro, ou preserva a sequência de um hábito específico
          (sem gerar XP). No máximo 1 uso por semana, mesmo com escudos guardados.
        </p>
      </div>
      <div v-if="user.shieldsRemaining === 0" class="text-sm text-muted-foreground">
        Sem escudos disponíveis agora — renova toda segunda-feira, ou compre mais na Taverna.
      </div>
      <template v-else>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="glass-inset rounded-full px-4 py-1.5 text-sm transition-colors"
            :class="shieldTargetType === 'protecao_dia' ? 'border border-primary text-foreground' : 'text-muted-foreground'"
            @click="shieldTargetType = 'protecao_dia'"
          >
            Proteger o dia de hoje
          </button>
          <button
            type="button"
            class="glass-inset rounded-full px-4 py-1.5 text-sm transition-colors"
            :class="shieldTargetType === 'protecao_streak' ? 'border border-primary text-foreground' : 'text-muted-foreground'"
            @click="shieldTargetType = 'protecao_streak'"
          >
            Proteger sequência de um hábito
          </button>
        </div>
        <Select v-if="shieldTargetType === 'protecao_streak'" v-model="shieldHabitId">
          <SelectTrigger>
            <SelectValue placeholder="Escolha um hábito" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="habit in activeHabitsForShield" :key="habit.id" :value="habit.id">
              {{ habit.name }} (sequência: {{ habit.streakCount }})
            </SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" class="rounded-full" :disabled="usingShield" @click="activateShield">
          {{ usingShield ? 'Ativando…' : 'Usar escudo' }}
        </Button>
        <p v-if="shieldError" class="text-sm text-red-400">{{ shieldError }}</p>
        <p v-if="shieldSuccess" class="text-sm text-emerald-400">{{ shieldSuccess }}</p>
      </template>
    </div>

    <div v-if="user.playerClass" class="glass-panel space-y-4 p-5">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h2 class="font-semibold">Trocar de classe</h2>
          <p class="text-sm text-muted-foreground">
            <template v-if="canChangeClass">Custa {{ classChangeCost }} XP (30% do XP atual), uma vez a cada 90 dias.</template>
            <template v-else>Disponível em {{ classChangeCooldownDaysLeft }} dia(s) — última troca há menos de 90 dias.</template>
          </p>
        </div>
        <Button v-if="canChangeClass" variant="ghost" size="sm" @click="showClassChange = !showClassChange">
          {{ showClassChange ? 'Cancelar' : 'Trocar' }}
        </Button>
      </div>
      <div v-if="showClassChange && canChangeClass" class="grid gap-3 sm:grid-cols-3">
        <button
          v-for="option in otherClassOptions"
          :key="option.value"
          type="button"
          :disabled="changingClass"
          class="glass-inset glass-panel-hover flex flex-col items-center gap-2 rounded-2xl p-4 text-center disabled:opacity-50"
          @click="changeClass(option.value)"
        >
          <component :is="option.icon" :size="24" />
          <p class="font-medium">{{ option.label }}</p>
          <p class="text-xs text-muted-foreground">{{ option.description }}</p>
        </button>
      </div>
      <p v-if="classChangeError" class="text-sm text-red-400">{{ classChangeError }}</p>
    </div>

    <div v-if="stats" class="glass-panel p-5">
      <h2 class="mb-1 font-semibold">Atributos</h2>
      <p class="mb-2 text-sm text-muted-foreground">XP acumulado por área — mostra seu estilo de jogo na vida real</p>
      <AttributeRadar :stats="stats" />
    </div>

    <div v-if="user.playerClass" class="glass-panel p-5">
      <SkillTree />
    </div>

    <div class="glass-panel p-5">
      <h2 class="mb-4 font-semibold">Evolução da classe</h2>
      <div class="space-y-3">
        <div
          v-for="milestone in milestones"
          :key="milestone.level"
          class="flex items-center gap-3 rounded-2xl p-3"
          :class="user.level >= milestone.level ? 'glass-inset' : 'opacity-40'"
        >
          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br" :class="classInfo?.gradient">
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

    <div class="glass-panel space-y-5 p-5">
      <div>
        <h2 class="font-semibold">Cosméticos</h2>
        <p class="text-sm text-muted-foreground">Equipe itens que você já comprou na Taverna</p>
      </div>
      <p v-if="cosmeticError" class="text-sm text-red-400">{{ cosmeticError }}</p>

      <div v-for="group in cosmeticGroups" :key="group.category" class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground">{{ group.label }}</h3>
        <div v-if="group.items.some((i) => user.ownedCosmetics.includes(i.id))" class="grid gap-2 sm:grid-cols-2">
          <button
            v-for="cosmetic in group.items.filter((i) => user.ownedCosmetics.includes(i.id))"
            :key="cosmetic.id"
            type="button"
            :disabled="equipping === cosmetic.id"
            class="glass-inset flex items-center justify-between gap-2 rounded-2xl border p-3 text-left text-sm transition-colors disabled:opacity-50"
            :class="isEquipped(group.category, cosmetic.id) ? 'border-primary' : 'border-white/5'"
            @click="toggleEquip(group.category, cosmetic.id)"
          >
            <span>{{ cosmetic.name }}</span>
            <Badge v-if="isEquipped(group.category, cosmetic.id)" variant="success">Equipado</Badge>
            <span v-else class="text-xs text-muted-foreground">Equipar</span>
          </button>
        </div>
        <p v-else class="text-xs text-muted-foreground">Nenhum ainda — compre na Taverna.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Award, Camera, Coins, Flame, Heart, Shield, Sparkles, Sword, Wand2 } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { BORDERS, THEMES, TITLES, type CosmeticCategory } from '#shared/cosmetics'
import { getMaxShields } from '#shared/economy'
import { getClassInfo } from '#shared/gamification'
import type { PlayerClass } from '#shared/types'

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

const milestones = [
  { level: 5, label: 'Escolha de classe', icon: Sparkles },
  { level: 15, label: 'Sub-evolução (Cavaleiro / Arcanista / Templário)', icon: Award },
  { level: 30, label: 'Sub-evolução máxima (Campeão / Arquimago / Cruzado)', icon: Award },
]
</script>

<template>
  <div v-if="user" class="space-y-6">
    <div class="hero-panel overflow-hidden">
      <div class="group relative h-40">
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

        <div class="pointer-events-auto absolute inset-x-0 bottom-0 flex items-center gap-4 p-6">
          <div class="group/avatar relative z-10 shrink-0">
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
              <h1 class="text-2xl font-semibold text-white drop-shadow-md">{{ user.name }}</h1>
              <Badge>{{ classInfo?.label }}</Badge>
            </div>
            <p v-if="equippedTitleName" class="text-sm font-medium text-amber-300 drop-shadow-md">{{ equippedTitleName }}</p>
          </div>
        </div>
        <div class="pointer-events-none absolute inset-y-0 right-6 hidden w-52 items-center sm:flex">
          <div class="pointer-events-auto w-full">
            <p class="text-sm text-white drop-shadow-md">Nível {{ user.level }} · {{ user.xp }} XP total</p>
            <Progress :model-value="xpIntoLevel" :max="xpNeeded" class="mt-2 glow-primary" />
            <p class="mt-1 text-xs text-white/80 drop-shadow-md">{{ xpIntoLevel }} / {{ xpNeeded }} XP para o nível {{ user.level + 1 }}</p>
          </div>
        </div>
      </div>
      <p v-if="coverError" class="px-6 pt-2 text-xs text-red-400">{{ coverError }}</p>
      <p v-if="avatarError" class="px-6 pt-2 text-xs text-red-400">{{ avatarError }}</p>
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

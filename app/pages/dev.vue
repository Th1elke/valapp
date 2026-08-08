<script setup lang="ts">
import { FlaskConical, RotateCcw } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { INVENTORY_ITEM_IDS, SHOP_ITEMS } from '#shared/economy'
import { SKILLS, type Skill } from '#shared/skills'
import type { PlayerClass } from '#shared/types'

definePageMeta({ middleware: () => (import.meta.dev ? undefined : navigateTo('/')) })

const { data: user, refresh: refreshUser } = useUserState()

const fieldClass =
  'h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

const xp = ref(0)
const level = ref(1)
const hp = ref(100)
const gold = ref(0)
const shieldsRemaining = ref(0)
const playerClass = ref<PlayerClass | ''>('')

const classOptions: { value: PlayerClass | ''; label: string }[] = [
  { value: '', label: 'Nenhuma' },
  { value: 'guerreiro', label: 'Guerreiro' },
  { value: 'mago', label: 'Mago' },
  { value: 'paladino', label: 'Paladino' },
]

const inventoryQty = ref<Record<string, number>>(Object.fromEntries(INVENTORY_ITEM_IDS.map((id) => [id, 0])))
const itemName: Record<string, string> = {}
for (const item of SHOP_ITEMS) {
  if (item.effect.kind === 'inventory') itemName[item.effect.itemId] = item.name
}

const skillsByClass = computed(() => {
  const groups: Record<PlayerClass, { path: string; label: string; skills: Skill[] }[]> = { guerreiro: [], mago: [], paladino: [] }
  for (const cls of ['guerreiro', 'mago', 'paladino'] as PlayerClass[]) {
    const classSkills = SKILLS.filter((s) => s.playerClass === cls)
    const pathIds = [...new Set(classSkills.map((s) => s.path))]
    groups[cls] = pathIds.map((path) => ({
      path,
      label: classSkills.find((s) => s.path === path)!.pathLabel,
      skills: classSkills.filter((s) => s.path === path).sort((a, b) => a.tier - b.tier),
    }))
  }
  return groups
})

const checkedSkills = ref<Set<string>>(new Set())

function syncFromUser() {
  if (!user.value) return
  xp.value = user.value.xp
  level.value = user.value.level
  hp.value = user.value.hp
  gold.value = user.value.gold
  shieldsRemaining.value = user.value.shieldsRemaining
  playerClass.value = user.value.playerClass ?? ''
  checkedSkills.value = new Set(user.value.unlockedSkills)
  for (const id of INVENTORY_ITEM_IDS) inventoryQty.value[id] = user.value.inventory[id] ?? 0
}
watch(user, syncFromUser, { immediate: true })

const saving = ref<string | null>(null)
const message = ref('')

async function apply(section: string, payload: Parameters<typeof devInject>[0]) {
  saving.value = section
  message.value = ''
  try {
    await devInject(payload)
    await refreshUser()
    message.value = `${section} aplicado.`
  } catch (err) {
    message.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Falha ao aplicar.'
  } finally {
    saving.value = null
  }
}

function applyStats() {
  apply('Recursos', {
    xp: xp.value,
    level: level.value,
    hp: hp.value,
    gold: gold.value,
    shieldsRemaining: shieldsRemaining.value,
  })
}

function applyClass() {
  apply('Classe', { playerClass: playerClass.value || null })
}

function toggleSkill(id: string) {
  if (checkedSkills.value.has(id)) checkedSkills.value.delete(id)
  else checkedSkills.value.add(id)
  checkedSkills.value = new Set(checkedSkills.value)
}

function applySkills() {
  apply('Habilidades', { setSkills: [...checkedSkills.value] })
}

function applyInventory() {
  apply('Inventário', { inventory: { ...inventoryQty.value } })
}

function resetAll() {
  apply('Reset completo', {
    xp: 0,
    level: 1,
    hp: 100,
    gold: 0,
    shieldsRemaining: 1,
    playerClass: null,
    setSkills: [],
    inventory: Object.fromEntries(INVENTORY_ITEM_IDS.map((id) => [id, 0])),
  })
}
</script>

<template>
  <div v-if="user" class="space-y-6">
    <div class="flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500">
        <FlaskConical :size="18" class="text-white" />
      </div>
      <div>
        <h1 class="text-2xl font-semibold">Painel de Teste</h1>
        <p class="text-sm text-muted-foreground">Só existe em desenvolvimento — injeta valores direto no banco pra sua conta logada, sem passar pelas regras normais do jogo</p>
      </div>
    </div>

    <p v-if="message" class="text-sm text-emerald-400">{{ message }}</p>

    <div class="glass-panel space-y-4 p-5">
      <h2 class="font-semibold">Recursos</h2>
      <div class="grid gap-3 sm:grid-cols-3">
        <label class="space-y-1 text-xs text-muted-foreground">
          XP
          <input v-model.number="xp" type="number" :class="fieldClass" />
        </label>
        <label class="space-y-1 text-xs text-muted-foreground">
          Nível
          <input v-model.number="level" type="number" :class="fieldClass" />
        </label>
        <label class="space-y-1 text-xs text-muted-foreground">
          HP (teto 100)
          <input v-model.number="hp" type="number" :class="fieldClass" />
        </label>
        <label class="space-y-1 text-xs text-muted-foreground">
          Ouro
          <input v-model.number="gold" type="number" :class="fieldClass" />
        </label>
        <label class="space-y-1 text-xs text-muted-foreground">
          Escudos disponíveis
          <input v-model.number="shieldsRemaining" type="number" :class="fieldClass" />
        </label>
      </div>
      <Button size="sm" class="rounded-full" :disabled="saving === 'Recursos'" @click="applyStats">
        {{ saving === 'Recursos' ? 'Aplicando…' : 'Aplicar recursos' }}
      </Button>
    </div>

    <div class="glass-panel space-y-4 p-5">
      <h2 class="font-semibold">Classe</h2>
      <select v-model="playerClass" :class="fieldClass">
        <option v-for="opt in classOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <Button size="sm" class="rounded-full" :disabled="saving === 'Classe'" @click="applyClass">
        {{ saving === 'Classe' ? 'Aplicando…' : 'Aplicar classe' }}
      </Button>
    </div>

    <div class="glass-panel space-y-4 p-5">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold">Habilidades</h2>
        <Badge variant="secondary">{{ checkedSkills.size }} marcadas</Badge>
      </div>
      <p class="text-xs text-muted-foreground">Marcar/desmarcar aqui ignora custo em SP e ordem de tier — é só pra testar o efeito de uma skill isolada.</p>
      <div v-for="(paths, cls) in skillsByClass" :key="cls" class="space-y-3">
        <h3 class="text-sm font-medium capitalize text-muted-foreground">{{ cls }}</h3>
        <div class="grid gap-3 sm:grid-cols-2">
          <div v-for="group in paths" :key="group.path" class="space-y-1.5">
            <p class="text-xs font-medium text-muted-foreground">{{ group.label }}</p>
            <label
              v-for="skill in group.skills"
              :key="skill.id"
              class="glass-inset flex cursor-pointer items-center gap-2 rounded-xl p-2 text-sm"
            >
              <input type="checkbox" :checked="checkedSkills.has(skill.id)" @change="toggleSkill(skill.id)" />
              {{ skill.name }}
            </label>
          </div>
        </div>
      </div>
      <Button size="sm" class="rounded-full" :disabled="saving === 'Habilidades'" @click="applySkills">
        {{ saving === 'Habilidades' ? 'Aplicando…' : 'Aplicar habilidades' }}
      </Button>
    </div>

    <div class="glass-panel space-y-4 p-5">
      <h2 class="font-semibold">Inventário</h2>
      <div class="grid gap-3 sm:grid-cols-3">
        <label v-for="id in INVENTORY_ITEM_IDS" :key="id" class="space-y-1 text-xs text-muted-foreground">
          {{ itemName[id] ?? id }}
          <input v-model.number="inventoryQty[id]" type="number" min="0" :class="fieldClass" />
        </label>
      </div>
      <Button size="sm" class="rounded-full" :disabled="saving === 'Inventário'" @click="applyInventory">
        {{ saving === 'Inventário' ? 'Aplicando…' : 'Aplicar inventário' }}
      </Button>
    </div>

    <div class="glass-panel space-y-3 p-5">
      <h2 class="font-semibold text-red-400">Zona de reset</h2>
      <p class="text-xs text-muted-foreground">Volta sua conta pro estado inicial: nível 1, sem classe, sem habilidades, sem itens.</p>
      <Button size="sm" variant="outline" class="rounded-full" :disabled="saving === 'Reset completo'" @click="resetAll">
        <RotateCcw :size="14" /> {{ saving === 'Reset completo' ? 'Resetando…' : 'Resetar tudo' }}
      </Button>
    </div>
  </div>
</template>

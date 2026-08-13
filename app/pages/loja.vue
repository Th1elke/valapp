<script setup lang="ts">
import { Coins, Crown, Eye, Feather, Gem, Heart, Hourglass, ShieldPlus, Sparkles, Zap } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BORDERS, COSMETIC_ITEMS, THEMES, TITLES, type CosmeticCategory } from '#shared/cosmetics'
import { getEffectiveCost, getMaxShields, SHOP_ITEMS, type ItemAccent, type ShopItem, type ShopItemId } from '#shared/economy'

const cosmeticIcons: Record<CosmeticCategory, typeof Crown> = { titulo: Crown, borda: Gem, tema: Sparkles }

/** Prestige badges use a light pearlescent background, so the icon needs a dark tone to stay legible. */
function badgeIconClass(accent: ItemAccent) {
  return accent.kind === 'prestige' ? 'text-amber-900' : 'text-white'
}

const { data: user, refresh: refreshUser } = useUserState()
const { data: habits } = useHabits()
const toast = useAppToast()

const itemIcons: Record<ShopItemId, typeof Heart> = {
  potion_small: Heart,
  potion_medium: Heart,
  potion_large: Heart,
  shield: ShieldPlus,
  olho_visao: Eye,
  escudo_cristal: Gem,
  elixir_erudito: Zap,
  pena_magica: Feather,
  ampulheta_tempo: Hourglass,
  ticket_estalagem: Coins,
}

const eligibleHabitsForRestore = computed(() => (habits.value ?? []).filter((h) => h.lastBrokenStreak != null))
const selectedHabitId = ref<string>('')

const buying = ref<string | null>(null)
const error = ref('')

const maxShields = computed(() => getMaxShields(user.value?.unlockedSkills ?? []))

function effectiveCost(item: ShopItem) {
  return getEffectiveCost(item, user.value?.unlockedSkills ?? [])
}

function canBuy(item: ShopItem) {
  if (!user.value) return false
  if (user.value.gold < effectiveCost(item)) return false
  if (item.effect.kind === 'shield' && user.value.shieldsRemaining >= maxShields.value) return false
  if (item.effect.kind === 'rest_day' && user.value.restDayDate) return false
  if (item.effect.kind === 'streak_restore' && (!selectedHabitId.value || eligibleHabitsForRestore.value.length === 0)) return false
  return true
}

async function buy(item: ShopItem) {
  buying.value = item.id
  error.value = ''
  try {
    await purchaseItem(item.id, item.effect.kind === 'streak_restore' ? { targetHabitId: selectedHabitId.value } : undefined)
    await refreshUser()
    toast.success(`${item.name} comprado!`)
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Não foi possível comprar.'
    toast.error(error.value)
  } finally {
    buying.value = null
  }
}

async function buyCosmetic(cosmeticId: string) {
  buying.value = cosmeticId
  error.value = ''
  try {
    await purchaseCosmetic(cosmeticId)
    await refreshUser()
    toast.success('Cosmético comprado!')
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Não foi possível comprar.'
    toast.error(error.value)
  } finally {
    buying.value = null
  }
}

// Meus Itens: equipar/desequipar cosméticos já comprados (unificado da antiga aba de Perfil).
const cosmeticGroups: { category: CosmeticCategory; label: string; items: typeof TITLES }[] = [
  { category: 'titulo', label: 'Títulos', items: TITLES },
  { category: 'borda', label: 'Bordas de Avatar', items: BORDERS },
  { category: 'tema', label: 'Temas de Cor', items: THEMES },
]
const equipping = ref<string | null>(null)
const equipError = ref('')

function isEquipped(category: CosmeticCategory, id: string) {
  if (!user.value) return false
  if (category === 'titulo') return user.value.equippedTitle === id
  if (category === 'borda') return user.value.equippedAvatarBorder === id
  return user.value.equippedTheme === id
}

async function toggleEquip(category: CosmeticCategory, id: string) {
  const wasEquipped = isEquipped(category, id)
  equipping.value = id
  equipError.value = ''
  try {
    await equipCosmetic(category, wasEquipped ? null : id)
    await refreshUser()
    toast.success(wasEquipped ? 'Item desequipado.' : 'Item equipado!')
  } catch (err) {
    equipError.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Não foi possível equipar.'
    toast.error(equipError.value)
  } finally {
    equipping.value = null
  }
}
</script>

<template>
  <div v-if="user" class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h1 class="text-2xl font-semibold">Taverna</h1>
        <p class="text-muted-foreground">Troque o ouro que você farmou nos hábitos por vantagens</p>
      </div>
      <div class="glass-inset flex items-center gap-2 rounded-full px-4 py-2">
        <Coins :size="18" class="text-amber-400" />
        <span class="font-semibold">{{ user.gold }}</span>
      </div>
    </div>

    <Tabs default-value="loja">
      <TabsList>
        <TabsTrigger value="loja">Loja</TabsTrigger>
        <TabsTrigger value="meus-itens">Meus Itens</TabsTrigger>
      </TabsList>

      <TabsContent value="loja">
        <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

        <div class="grid gap-4 sm:grid-cols-2">
          <Card v-for="item in SHOP_ITEMS" :key="item.id" class="glass-panel border-0">
            <CardContent class="flex flex-col gap-4 pt-6">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                  :class="[item.accent.className, item.accent.kind === 'prestige' ? item.accent.glowClassName : '']"
                >
                  <component :is="itemIcons[item.id]" :size="22" :class="badgeIconClass(item.accent)" />
                </div>
                <div class="min-w-0">
                  <p class="font-medium">{{ item.name }}</p>
                  <p class="text-sm text-muted-foreground">{{ item.description }}</p>
                </div>
              </div>

              <Select v-if="item.effect.kind === 'streak_restore'" v-model="selectedHabitId">
                <SelectTrigger>
                  <SelectValue placeholder="Escolha o hábito…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="h in eligibleHabitsForRestore" :key="h.id" :value="h.id">
                    {{ h.name }} (sequência perdida: {{ h.lastBrokenStreak }})
                  </SelectItem>
                </SelectContent>
              </Select>
              <p v-if="item.effect.kind === 'streak_restore' && eligibleHabitsForRestore.length === 0" class="text-xs text-muted-foreground">
                Nenhum hábito com sequência recente para restaurar.
              </p>

              <div class="flex items-center justify-between">
                <span class="flex items-center gap-1 text-sm font-semibold text-amber-400">
                  <Coins :size="14" />
                  <template v-if="effectiveCost(item) < item.cost">
                    <span class="text-muted-foreground line-through">{{ item.cost }}</span> {{ effectiveCost(item) }}
                  </template>
                  <template v-else>{{ item.cost }}</template>
                </span>
                <Button
                  size="sm"
                  class="rounded-full"
                  :disabled="!canBuy(item) || buying === item.id"
                  @click="buy(item)"
                >
                  {{ buying === item.id ? 'Comprando…' : 'Comprar' }}
                </Button>
              </div>

              <p v-if="item.effect.kind === 'shield' && user.shieldsRemaining >= maxShields" class="text-xs text-muted-foreground">
                Máximo de {{ maxShields }} escudos atingido.
              </p>
              <p v-if="item.effect.kind === 'inventory'" class="text-xs text-muted-foreground">
                Você tem {{ user.inventory[item.effect.itemId] ?? 0 }}
              </p>
              <p v-if="item.effect.kind === 'rest_day' && user.restDayDate" class="text-xs text-muted-foreground">
                Ticket já ativo para hoje.
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 class="mb-3 text-lg font-semibold">Cosméticos</h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <Card v-for="cosmetic in COSMETIC_ITEMS" :key="cosmetic.id" class="glass-panel border-0">
              <CardContent class="flex flex-col gap-4 pt-6">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                    :class="[cosmetic.accent.className, cosmetic.accent.kind === 'prestige' ? cosmetic.accent.glowClassName : '']"
                  >
                    <component :is="cosmeticIcons[cosmetic.category]" :size="22" :class="badgeIconClass(cosmetic.accent)" />
                  </div>
                  <div class="min-w-0">
                    <p class="font-medium">{{ cosmetic.name }}</p>
                    <p class="text-sm text-muted-foreground">{{ cosmetic.description }}</p>
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <span class="flex items-center gap-1 text-sm font-semibold text-amber-400">
                    <Coins :size="14" /> {{ cosmetic.cost }}
                  </span>
                  <Button
                    size="sm"
                    class="rounded-full"
                    :disabled="user.ownedCosmetics.includes(cosmetic.id) || user.gold < cosmetic.cost || buying === cosmetic.id"
                    @click="buyCosmetic(cosmetic.id)"
                  >
                    {{ user.ownedCosmetics.includes(cosmetic.id) ? 'Adquirido' : buying === cosmetic.id ? 'Comprando…' : 'Comprar' }}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="meus-itens">
        <p v-if="equipError" class="text-sm text-destructive">{{ equipError }}</p>

        <div class="glass-panel space-y-5 p-5">
          <p class="text-sm text-muted-foreground">Equipe os itens que você já comprou — o que estiver ativo aqui aparece no seu perfil.</p>

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
            <p v-else class="text-xs text-muted-foreground">Nenhum ainda — compre na aba Loja.</p>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>

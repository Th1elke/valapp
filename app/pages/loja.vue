<script setup lang="ts">
import { Coins, Heart, ShieldPlus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MAX_SHIELDS, SHOP_ITEMS } from '#shared/economy'

const { data: user, refresh: refreshUser } = useUserState()

const itemIcons = { potion: Heart, shield: ShieldPlus }

const buying = ref<string | null>(null)
const error = ref('')

function canBuy(itemId: 'potion' | 'shield', cost: number) {
  if (!user.value) return false
  if (user.value.gold < cost) return false
  if (itemId === 'shield' && user.value.shieldsRemaining >= MAX_SHIELDS) return false
  return true
}

async function buy(itemId: 'potion' | 'shield') {
  buying.value = itemId
  error.value = ''
  try {
    await purchaseItem(itemId)
    await refreshUser()
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Não foi possível comprar.'
  } finally {
    buying.value = null
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

    <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

    <div class="grid gap-4 sm:grid-cols-2">
      <Card v-for="item in SHOP_ITEMS" :key="item.id" class="glass-panel border-0">
        <CardContent class="flex flex-col gap-4 pt-6">
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500">
              <component :is="itemIcons[item.id]" :size="22" class="text-white" />
            </div>
            <div class="min-w-0">
              <p class="font-medium">{{ item.name }}</p>
              <p class="text-sm text-muted-foreground">{{ item.description }}</p>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <span class="flex items-center gap-1 text-sm font-semibold text-amber-400">
              <Coins :size="14" /> {{ item.cost }}
            </span>
            <Button
              size="sm"
              class="rounded-full"
              :disabled="!canBuy(item.id, item.cost) || buying === item.id"
              @click="buy(item.id)"
            >
              {{ buying === item.id ? 'Comprando…' : 'Comprar' }}
            </Button>
          </div>

          <p v-if="item.id === 'shield' && user.shieldsRemaining >= MAX_SHIELDS" class="text-xs text-muted-foreground">
            Máximo de {{ MAX_SHIELDS }} escudos atingido.
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

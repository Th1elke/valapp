<script setup lang="ts">
import { Coins } from 'lucide-vue-next'

const XP_MAX = 300
const XP_TARGET = 120
const HP_MAX = 20
const HP_TARGET = 18
const GOLD_TARGET = 240

const XP_FILL_DURATION = 900
const HP_FILL_DURATION = 1800
const START_DELAY = 80

const xpWidthPercent = ref(0)
const hpWidthPercent = ref(0)

const xp = useCountUp(XP_TARGET, XP_FILL_DURATION, START_DELAY)
const hp = useCountUp(HP_TARGET, HP_FILL_DURATION, START_DELAY)
const gold = useCountUp(GOLD_TARGET, XP_FILL_DURATION, START_DELAY)

onMounted(() => {
  const applyWidths = () => {
    xpWidthPercent.value = Math.round((XP_TARGET / XP_MAX) * 100)
    hpWidthPercent.value = Math.round((HP_TARGET / HP_MAX) * 100)
  }
  if (prefersReducedMotion()) applyWidths()
  else setTimeout(applyWidths, START_DELAY)
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 backdrop-blur-sm">
    <span class="text-xs font-bold uppercase tracking-wider text-white/40">Nv. 1</span>
    <div class="min-w-[110px] flex-1">
      <div class="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-primary/80">
        <span>XP</span><span>{{ xp }}/{{ XP_MAX }}</span>
      </div>
      <div class="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          class="h-full rounded-full bg-primary transition-[width] duration-[900ms] ease-out"
          :style="{ width: xpWidthPercent + '%' }"
        />
      </div>
    </div>
    <div class="min-w-[110px] flex-1">
      <div class="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-rose-300/80">
        <span>HP</span><span>{{ hp }}/{{ HP_MAX }}</span>
      </div>
      <div class="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          class="h-full rounded-full bg-rose-500 transition-[width] duration-[1800ms] ease-out"
          :style="{ width: hpWidthPercent + '%' }"
        />
      </div>
    </div>
    <span class="flex items-center gap-1 text-xs font-bold text-white/60">
      <Coins :size="13" /> {{ gold }}
    </span>
  </div>
</template>

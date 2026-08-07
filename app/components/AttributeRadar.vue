<script setup lang="ts">
import { attributeAbbr, attributeLabel, type AttributeStatsDTO } from '#shared/types'

const props = defineProps<{ stats: AttributeStatsDTO[] }>()

const SIZE_X = 300
const SIZE_Y = 240
const CENTER_X = SIZE_X / 2
const CENTER_Y = SIZE_Y / 2
const MAX_RADIUS = 72
const RINGS = [0.25, 0.5, 0.75, 1]

const maxValue = computed(() => Math.max(100, ...props.stats.map((s) => s.xp)))

const axes = computed(() =>
  props.stats.map((stat, i) => {
    const angle = -Math.PI / 2 + i * ((2 * Math.PI) / props.stats.length)
    const ratio = stat.xp / maxValue.value
    const dataR = ratio * MAX_RADIUS
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    const labelR = MAX_RADIUS + 26
    const anchor = cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle'

    return {
      category: stat.category,
      value: stat.xp,
      point: `${CENTER_X + cos * dataR},${CENTER_Y + sin * dataR}`,
      axisEnd: { x: CENTER_X + cos * MAX_RADIUS, y: CENTER_Y + sin * MAX_RADIUS },
      label: { x: CENTER_X + cos * labelR, y: CENTER_Y + sin * labelR, anchor },
    }
  }),
)

const polygonPoints = computed(() => axes.value.map((a) => a.point).join(' '))

function ringPoints(ratio: number) {
  return axes.value
    .map((_, i) => {
      const angle = -Math.PI / 2 + i * ((2 * Math.PI) / axes.value.length)
      const r = ratio * MAX_RADIUS
      return `${CENTER_X + Math.cos(angle) * r},${CENTER_Y + Math.sin(angle) * r}`
    })
    .join(' ')
}
</script>

<template>
  <div>
    <svg :viewBox="`0 0 ${SIZE_X} ${SIZE_Y}`" class="mx-auto w-full max-w-sm overflow-visible">
      <polygon
        v-for="ring in RINGS"
        :key="ring"
        :points="ringPoints(ring)"
        fill="none"
        stroke="hsl(var(--border))"
        stroke-width="1"
      />
      <line
        v-for="axis in axes"
        :key="`axis-${axis.category}`"
        :x1="CENTER_X"
        :y1="CENTER_Y"
        :x2="axis.axisEnd.x"
        :y2="axis.axisEnd.y"
        stroke="hsl(var(--border))"
        stroke-width="1"
      />

      <polygon :points="polygonPoints" fill="hsl(var(--primary) / 0.25)" stroke="hsl(var(--primary))" stroke-width="2" stroke-linejoin="round" />
      <circle
        v-for="axis in axes"
        :key="`dot-${axis.category}`"
        :cx="axis.point.split(',')[0]"
        :cy="axis.point.split(',')[1]"
        r="4"
        fill="hsl(var(--primary))"
      />

      <text
        v-for="axis in axes"
        :key="`label-${axis.category}`"
        :x="axis.label.x"
        :y="axis.label.y"
        :text-anchor="axis.label.anchor"
        dominant-baseline="middle"
        class="fill-foreground text-[11px] font-semibold"
      >
        {{ attributeAbbr[axis.category] }}
      </text>
      <text
        v-for="axis in axes"
        :key="`value-${axis.category}`"
        :x="axis.label.x"
        :y="axis.label.y + 13"
        :text-anchor="axis.label.anchor"
        dominant-baseline="middle"
        class="fill-muted-foreground text-[9px]"
      >
        {{ axis.value }}
      </text>
    </svg>

    <p class="mt-2 text-center text-xs text-muted-foreground">
      <span v-for="(axis, i) in axes" :key="axis.category">
        <span class="font-medium text-foreground">{{ attributeAbbr[axis.category] }}</span> {{ attributeLabel[axis.category] }}
        <span v-if="i < axes.length - 1"> · </span>
      </span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import UChart from '@nuxt/ui/components/Chart.vue'
import type { z } from 'zod/v4'
import type { ChartDef } from '../defs'

type Props = z.infer<typeof ChartDef.props>
const props = defineProps<{ props: Props }>()
// Reactive on purpose: the renderer patches this instance in place while the program streams.
const p = computed(() => props.props ?? {})
const ready = computed(() => {
  const labels = p.value.labels
  const series = p.value.series
  return Array.isArray(labels) && Array.isArray(series) && labels.length > 0 && series.every(s => Array.isArray(s.data) && s.data.length === labels.length)
})
// UChart consumes row objects: one row per label, one value column per series name, plus the index key.
const chartData = computed(() => (p.value.labels ?? []).map((label, index) => {
  const row: Record<string, string | number> = { label }
  for (const s of p.value.series ?? []) row[s.name] = s.data[index] ?? 0
  return row
}))
const categories = computed(() => (p.value.series ?? []).map(s => s.name))
const chartType = computed(() => (p.value.type === 'pie' ? 'donut' : p.value.type ?? 'bar'))
</script>
<template>
  <div v-if="ready">
    <p v-if="p.title" class="text-sm font-medium mb-2">{{ p.title }}</p>
    <UChart :type="chartType" :data="chartData" index="label" :categories="categories" :height="240" />
  </div>
</template>

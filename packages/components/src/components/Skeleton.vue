<script setup lang="ts">
import USkeleton from '@nuxt/ui/components/Skeleton.vue'
import { computed } from 'vue'
const props = defineProps<{ props: { width?: number; height?: number; lines?: number } }>()
// Reactive on purpose: the renderer patches this instance in place while the program streams.
const p = computed(() => props.props ?? {})
function clampDim(v: unknown): number | undefined {
  if (typeof v !== 'number' || !Number.isFinite(v)) return undefined
  return Math.min(480, Math.max(8, Math.round(v)))
}
const lineCount = computed(() => {
  const n = p.value.lines
  if (typeof n !== 'number' || !Number.isFinite(n)) return 1
  return Math.min(6, Math.max(1, Math.floor(n)))
})
const width = computed(() => {
  const w = clampDim(p.value.width)
  return w === undefined ? '100%' : `${w}px`
})
const height = computed(() => {
  const h = clampDim(p.value.height)
  return h === undefined ? '1rem' : `${h}px`
})
function rowWidth(index: number): string {
  return lineCount.value > 1 && index === lineCount.value - 1 ? '66%' : width.value
}
</script>
<template>
  <div class="flex flex-col gap-2">
    <USkeleton v-for="i in lineCount" :key="i" :style="{ width: rowWidth(i - 1), height }" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import UChip from '@nuxt/ui/components/Chip.vue'
import { hasAllProps } from '../helpers'
const props = defineProps<{ props: { text?: string; color?: string; size?: string } }>()
// Reactive on purpose: the renderer patches this instance in place while the program streams.
const p = computed(() => props.props ?? {})
const CHIP_COLORS = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
const CHIP_SIZES = ['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const
type ChipColor = (typeof CHIP_COLORS)[number]
type ChipSize = (typeof CHIP_SIZES)[number]
function pick<T extends string>(v: unknown, allowed: readonly T[]): T | undefined {
  if (typeof v !== 'string') return undefined
  const s = v.trim()
  return (allowed as readonly string[]).includes(s) ? (s as T) : undefined
}
const color = computed(() => pick<ChipColor>(p.value.color, CHIP_COLORS))
const size = computed(() => pick<ChipSize>(p.value.size, CHIP_SIZES))
</script>
<template>
  <UChip v-if="hasAllProps(p, 'text')" :text="p.text" :color="color" :size="size" standalone />
</template>

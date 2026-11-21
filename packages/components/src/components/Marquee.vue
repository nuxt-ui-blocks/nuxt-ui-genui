<script setup lang="ts">
import UMarquee from '@nuxt/ui/components/Marquee.vue'
import { computed } from 'vue'

const props = defineProps<{ props: { text?: string; reverse?: boolean; pauseOnHover?: boolean; repeat?: number } }>()
const p = computed(() => props.props ?? {})
const repeat = computed(() => {
  const n = Number(p.value.repeat)
  if (!Number.isFinite(n)) return 4
  return Math.min(10, Math.max(1, Math.floor(n)))
})
</script>

<template>
  <UMarquee v-if="p?.text" :pause-on-hover="p?.pauseOnHover" :reverse="p?.reverse" :repeat="repeat" class="text-sm text-muted">
    <span class="mx-6 select-none">{{ p.text }}</span>
  </UMarquee>
</template>

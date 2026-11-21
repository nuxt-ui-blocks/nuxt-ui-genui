<script setup lang="ts">
import { computed } from 'vue'
import UCard from '@nuxt/ui/components/Card.vue'
import UBadge from '@nuxt/ui/components/Badge.vue'
import type { z } from 'zod/v4'
import type { StatsCardDef } from '../defs'

type Props = z.infer<typeof StatsCardDef.props>
const props = defineProps<{ props: Props }>()
// Reactive on purpose: the renderer patches this instance in place while the program streams.
const p = computed(() => props.props ?? {})
</script>
<template>
  <UCard>
    <p v-if="p.label" class="text-xs uppercase tracking-wide text-muted">{{ p.label }}</p>
    <p v-if="p.value" class="text-2xl font-bold mt-1">{{ p.value }}</p>
    <UBadge v-if="p.delta" class="mt-2" :color="p.trend === 'down' ? 'error' : p.trend === 'up' ? 'success' : 'neutral'" variant="subtle">{{ p.delta }}</UBadge>
  </UCard>
</template>

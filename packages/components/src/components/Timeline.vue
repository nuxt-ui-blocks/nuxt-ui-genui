<script setup lang="ts">
import UTimeline from '@nuxt/ui/components/Timeline.vue'
import { computed } from 'vue'
import type { z } from 'zod/v4'
import type { TimelineDef } from '../defs'

type Props = z.infer<typeof TimelineDef.props>
const props = defineProps<{ props: Props }>()
// Reactive on purpose: containers are patched in place while the program streams.
const p = computed(() => props.props ?? {})
const items = computed(() => (Array.isArray(p.value.items) ? p.value.items : []))
</script>
<template>
  <UTimeline v-if="items.length" :items="items" />
</template>

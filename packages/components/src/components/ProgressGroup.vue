<script setup lang="ts">
import UProgressGroup from '@nuxt/ui/components/ProgressGroup.vue'
import { computed } from 'vue'
import { asArray } from '../helpers'
import type { z } from 'zod/v4'
import type { ProgressGroupDef } from '../defs'

type Props = z.infer<typeof ProgressGroupDef.props>
const props = defineProps<{ props: Props }>()
// Reactive on purpose: the renderer patches this instance in place while the program streams.
const p = computed(() => props.props ?? {})
const items = computed(() => asArray(p.value.items))
const max = computed(() => (typeof p.value.max === 'number' && p.value.max > 0 ? p.value.max : 100))
</script>
<template>
  <UProgressGroup :items="items" :max="max" :status="p?.status" :orientation="p?.orientation" />
</template>

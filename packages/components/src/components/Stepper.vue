<script setup lang="ts">
import UStepper from '@nuxt/ui/components/Stepper.vue'
import { computed, ref, watch } from 'vue'
import type { z } from 'zod/v4'
import type { StepperDef } from '../defs'

type Props = z.infer<typeof StepperDef.props>
const props = defineProps<{ props: Props }>()
// Reactive on purpose: containers are patched in place while the program streams.
const p = computed(() => props.props ?? {})
const items = computed(() => (Array.isArray(p.value.items) ? p.value.items : []))
const clamp = (v: number) => Math.max(0, Math.min(Number.isFinite(v) ? Math.trunc(v) : 0, Math.max(items.value.length - 1, 0)))
const current = ref(clamp(p.value.current ?? 0))
watch(items, () => { current.value = clamp(current.value) })
watch(() => p.value.current, (v) => { if (v !== undefined) current.value = clamp(v) })
</script>
<template>
  <UStepper v-if="items.length" v-model="current" :items="items" />
</template>

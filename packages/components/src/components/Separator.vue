<script setup lang="ts">
import USeparator from '@nuxt/ui/components/Separator.vue'
import { computed } from 'vue'
const props = defineProps<{ props: { label?: string; orientation?: 'horizontal' | 'vertical' } }>()
// Reactive on purpose: the renderer patches this instance in place while the program streams.
const p = computed(() => props.props ?? {})
const label = computed(() => (typeof p.value.label === 'string' && p.value.label.trim() ? p.value.label.trim() : undefined))
const orientation = computed(() => (p.value.orientation === 'horizontal' || p.value.orientation === 'vertical' ? p.value.orientation : undefined))
</script>
<template>
  <USeparator :label="label" :orientation="orientation" :decorative="!label" />
</template>

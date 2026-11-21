<script setup lang="ts">
import { computed } from 'vue'
import UBadge from '@nuxt/ui/components/Badge.vue'
import { hasAllProps } from '../helpers'
const props = defineProps<{ props: { label?: string; color?: 'neutral' | 'primary' | 'success' | 'warning' | 'error' } }>()
// Reactive on purpose: the renderer patches this instance in place while the program streams.
const p = computed(() => props.props ?? {})
</script>
<template>
  <UBadge v-if="hasAllProps(p, 'label')" :label="p.label" :color="p.color ?? 'neutral'" />
</template>

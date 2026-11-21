<script setup lang="ts">
import { computed } from 'vue'
import UAlert from '@nuxt/ui/components/Alert.vue'
import { hasAllProps } from '../helpers'
const props = defineProps<{ props: { title?: string; description?: string; color?: 'info' | 'success' | 'warning' | 'error' } }>()
// Reactive on purpose: the renderer patches this instance in place while the program streams.
const p = computed(() => props.props ?? {})
</script>
<template>
  <UAlert v-if="hasAllProps(p, 'title')" :color="p.color ?? 'info'" :title="p.title" :description="p.description" />
</template>

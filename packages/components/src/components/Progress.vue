<script setup lang="ts">
import { computed } from 'vue'
import UProgress from '@nuxt/ui/components/Progress.vue'
const props = defineProps<{ props: { value?: number; label?: string } }>()
// Reactive on purpose: the renderer patches this instance in place while the program streams.
const p = computed(() => props.props ?? {})
</script>
<template>
  <div>
    <p v-if="p.label" class="text-sm text-muted mb-1">{{ p.label }}</p>
    <UProgress :model-value="p.value ?? 0" :max="100" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import UEmpty from '@nuxt/ui/components/Empty.vue'
import { hasAllProps } from '../helpers'
const props = defineProps<{ props: { title?: string; description?: string; icon?: string } }>()
// Reactive on purpose: the renderer patches this instance in place while the program streams.
const p = computed(() => props.props ?? {})
</script>
<template>
  <UEmpty v-if="hasAllProps(p, 'title')" :title="p.title" :description="p.description" :icon="p.icon" />
</template>

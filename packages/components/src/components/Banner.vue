<script setup lang="ts">
import { computed } from 'vue'
import UBanner from '@nuxt/ui/components/Banner.vue'
import { hasAllProps } from '../helpers'
const props = defineProps<{ props: { title?: string; icon?: string } }>()
// Reactive on purpose: the renderer patches this instance in place while the program streams.
const p = computed(() => props.props ?? {})
</script>
<template>
  <UBanner v-if="hasAllProps(p, 'title')" :title="p.title" :icon="p.icon" />
</template>

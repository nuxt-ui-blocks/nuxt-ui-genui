<script setup lang="ts">
import UChatShimmer from '@nuxt/ui/components/ChatShimmer.vue'
import { computed } from 'vue'
const props = defineProps<{ props: { text?: string } }>()
// Reactive on purpose: the renderer patches this instance in place while the program streams.
const p = computed(() => props.props ?? {})
const text = computed(() => (typeof p.value.text === 'string' && p.value.text.trim() ? p.value.text : undefined))
</script>
<template>
  <UChatShimmer v-if="text" :text="text" />
</template>

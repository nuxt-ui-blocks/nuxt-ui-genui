<script setup lang="ts">
import UChatReasoning from '@nuxt/ui/components/ChatReasoning.vue'
import { computed } from 'vue'
const props = defineProps<{ props: { text?: string; streaming?: boolean } }>()
// Reactive on purpose: the renderer patches this instance in place while the program streams.
const p = computed(() => props.props ?? {})
const text = computed(() => (typeof p.value.text === 'string' && p.value.text.length > 0 ? p.value.text : undefined))
</script>
<template>
  <UChatReasoning v-if="text" :text="text" :streaming="p.streaming === true" />
</template>

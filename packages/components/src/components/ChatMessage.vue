<script setup lang="ts">
import UChatMessage from '@nuxt/ui/components/ChatMessage.vue'
import { computed, useId } from 'vue'
const props = defineProps<{ props: { role?: 'user' | 'assistant' | 'system'; text?: string } }>()
// Reactive on purpose: the renderer patches this instance in place while the program streams.
const p = computed(() => props.props ?? {})
// The model never sends an id, so every mounted instance gets its own stable one.
const instanceId = useId()
const message = computed(() => {
  const role = p.value.role
  const text = p.value.text
  if ((role !== 'user' && role !== 'assistant' && role !== 'system') || typeof text !== 'string') return null
  return { id: instanceId, role, parts: [{ type: 'text' as const, text }] }
})
</script>
<template>
  <UChatMessage v-if="message" :id="message.id" :role="message.role" :parts="message.parts" />
</template>

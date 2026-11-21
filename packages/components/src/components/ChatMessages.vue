<script setup lang="ts">
import UChatMessages from '@nuxt/ui/components/ChatMessages.vue'
import { computed } from 'vue'
import { asArray } from '../helpers'
type Role = 'user' | 'assistant' | 'system'
type Status = 'ready' | 'submitted' | 'streaming' | 'error'
const props = defineProps<{ props: { messages?: Array<{ role?: Role; text?: string }>; status?: Status } }>()
// Reactive on purpose: the renderer patches this instance in place while the program streams.
const p = computed(() => props.props ?? {})
const STATUSES: readonly string[] = ['ready', 'submitted', 'streaming', 'error']
const messages = computed(() =>
  asArray(p.value.messages)
    .filter((m): m is { role?: Role; text?: string } => !!m && typeof m === 'object')
    .filter((m) => (m.role === 'user' || m.role === 'assistant' || m.role === 'system') && typeof m.text === 'string')
    .slice(0, 100)
    .map((m, i) => ({
      id: `message-${i}`,
      role: m.role as Role,
      parts: [{ type: 'text' as const, text: m.text as string }]
    }))
)
const status = computed(() => (typeof p.value.status === 'string' && STATUSES.includes(p.value.status) ? p.value.status : undefined))
</script>
<template>
  <UChatMessages :messages="messages" :status="status" />
</template>

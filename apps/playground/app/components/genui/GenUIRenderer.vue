<script setup lang="ts">
import { Renderer, type ActionEvent, type OpenUIError } from '@openuidev/vue-lang'
import { genuiLibrary } from '#shared/genui/library'

const props = defineProps<{
  response: string | null
  isStreaming?: boolean
}>()

const emit = defineEmits<{
  action: [event: ActionEvent]
  error: [errors: OpenUIError[]]
}>()

function handleAction(event: ActionEvent) {
  emit('action', event)
}
</script>

<template>
  <Renderer
    :response="props.response"
    :library="genuiLibrary"
    :is-streaming="props.isStreaming ?? false"
    :on-action="handleAction"
    :on-error="(errors) => emit('error', errors)"
  />
</template>

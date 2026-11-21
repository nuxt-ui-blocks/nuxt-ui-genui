<script setup lang="ts">
import { computed } from 'vue'
import type { GenUIChatStatus } from '@nuxt-ui-genui/chat'
import type { FileWithStatus } from '~/types/chat'

const props = withDefaults(defineProps<{
  status?: GenUIChatStatus
  error?: Error
  files?: FileWithStatus[]
  uploading?: boolean
  disabled?: boolean
  open: () => void
}>(), {
  status: 'ready',
  files: () => [],
  uploading: false,
  disabled: false
})

const emit = defineEmits<{
  submit: [event: Event]
  stop: []
  reload: []
  remove: [id: string]
}>()

const input = defineModel<string>({ default: '' })

const placeholder = computed(() => {
  if (props.uploading) return 'Uploading files...'
  return 'Ask about launches, incidents, vendors, KPIs, deploys, approvals...'
})
</script>

<template>
  <UChatPrompt
    v-model="input"
    :error="error"
    :disabled="uploading || disabled"
    :placeholder="placeholder"
    color="neutral"
    variant="subtle"
    :ui="{ base: ['px-1.5'] }"
    @submit="emit('submit', $event)"
  >
    <template v-if="files.length" #header>
      <ChatFiles :files="files" @remove="emit('remove', $event)" />
    </template>

    <template #footer>
      <ChatPromptMenu :open="open" />

      <div class="flex items-center gap-1">
        <ModelSelect />

        <UChatPromptSubmit
          :status="status"
          :disabled="uploading || disabled"
          color="neutral"
          size="sm"
          @stop="emit('stop')"
          @reload="emit('reload')"
        />
      </div>
    </template>
  </UChatPrompt>
</template>

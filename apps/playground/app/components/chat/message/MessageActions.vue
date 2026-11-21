<script setup lang="ts">
import { computed } from 'vue'
import { useClipboard } from '@vueuse/core'
import { collectAssistantText, type GenUIMessage } from '@nuxt-ui-genui/chat'

const props = defineProps<{
  message: GenUIMessage & { createdAt?: string | Date }
  streaming?: boolean
  editing?: boolean
  vote?: boolean | null
}>()

const emit = defineEmits<{
  edit: []
  regenerate: []
  vote: [message: GenUIMessage, isUpvoted: boolean]
}>()

const { copy, copied } = useClipboard({ source: computed(() => collectAssistantText(props.message)) })

const isUser = computed(() => props.message.role === 'user')
const hasFiles = computed(() => props.message.parts.some(part => part.type === 'file'))
const createdAt = computed(() => {
  if (!props.message.createdAt) return null
  return new Date(props.message.createdAt)
})
</script>

<template>
  <div class="flex items-center gap-0.5">
    <template v-if="!isUser && !streaming">
      <UTooltip text="Copy">
        <UButton
          :icon="copied ? 'i-lucide-copy-check' : 'i-lucide-copy'"
          :color="copied ? 'primary' : 'neutral'"
          size="sm"
          variant="ghost"
          aria-label="Copy response"
          @click="copy()"
        />
      </UTooltip>

      <UTooltip text="Good response">
        <UButton
          icon="i-lucide-thumbs-up"
          :color="vote === true ? 'success' : 'neutral'"
          size="sm"
          variant="ghost"
          aria-label="Good response"
          @click="emit('vote', message, true)"
        />
      </UTooltip>

      <UTooltip text="Bad response">
        <UButton
          icon="i-lucide-thumbs-down"
          :color="vote === false ? 'error' : 'neutral'"
          size="sm"
          variant="ghost"
          aria-label="Bad response"
          @click="emit('vote', message, false)"
        />
      </UTooltip>

      <UTooltip text="Regenerate">
        <UButton
          icon="i-lucide-rotate-cw"
          color="neutral"
          size="sm"
          variant="ghost"
          aria-label="Regenerate"
          @click="emit('regenerate')"
        />
      </UTooltip>
    </template>

    <template v-else-if="isUser && !streaming && !editing">
      <time v-if="createdAt" :datetime="createdAt.toISOString()" class="mr-1.5 text-xs text-muted">
        {{ createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
      </time>

      <UTooltip v-if="!hasFiles" text="Edit">
        <UButton
          icon="i-lucide-pencil"
          color="neutral"
          size="sm"
          variant="ghost"
          aria-label="Edit message"
          @click="emit('edit')"
        />
      </UTooltip>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { isPartStreaming, isReasoningPart, isTextPart, type GenUIMessage } from '@nuxt-ui-genui/chat'
import type { ActionEvent } from '@openuidev/vue-lang'
import { PLAYGROUND_CARD_CHILDREN } from '~/lib/library'

const props = defineProps<{
  message: GenUIMessage
  editing?: boolean
  library: unknown
  isWorking: boolean
  onAction: (event: ActionEvent) => void
  toolProvider?: Record<string, (args: Record<string, unknown>) => Promise<unknown>>
}>()

const emit = defineEmits<{
  save: [message: GenUIMessage, text: string]
  cancelEdit: []
}>()

const isUser = computed(() => props.message.role === 'user')
const isStreaming = computed(() => props.isWorking && !isUser.value)

function partText(part: { text?: string }) {
  return part.text ?? ''
}

function isProgram(text: string) {
  return /(^|\n)\s*root\s*=/.test(text)
}

function editText() {
  return props.message.parts
    .filter(isTextPart)
    .map(part => part.text)
    .join('\n\n')
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <template v-for="(part, index) in message.parts" :key="index">
      <UChatReasoning
        v-if="isReasoningPart(part) && !isUser"
        :text="partText(part)"
        :streaming="isStreaming && isPartStreaming(part)"
        chevron="leading"
      >
        <ChatComark :value="partText(part)" :streaming="isStreaming && isPartStreaming(part)" />
      </UChatReasoning>

      <template v-else-if="isTextPart(part)">
        <!-- Host prose vs a generated Lang program — never both -->
        <template v-if="!isUser">
          <NuxtGenUI
            v-if="isProgram(partText(part))"
            :library="(library as never)"
            :response="partText(part)"
            :is-streaming="isStreaming && isPartStreaming(part)"
            :on-action="onAction"
            :tool-provider="props.toolProvider"
            :card-children="PLAYGROUND_CARD_CHILDREN"
          />
          <ChatComark v-else :value="partText(part)" :streaming="isStreaming && isPartStreaming(part)" />
        </template>

        <ChatMessageEdit
          v-else-if="editing"
          :message="message"
          :text="partText(part)"
          @save="(msg, text) => emit('save', msg, text)"
          @cancel="emit('cancelEdit')"
        />
        <p v-else class="whitespace-pre-wrap">
          {{ partText(part) }}
        </p>
      </template>
    </template>

    <p v-if="isUser && !editing && editText()" class="sr-only">{{ editText() }}</p>
  </div>
</template>

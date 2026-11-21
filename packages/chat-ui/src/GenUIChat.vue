<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'
import type { GenUIChat as GenUIChatClient } from '@nuxt-ui-genui/chat'
import { ChatMessages, ChatPrompt, ChatPromptSubmit } from './components'
import { MESSAGE_SLOTS, activeSlots } from './slots'

const props = withDefaults(defineProps<{
  /** The chat client. The host owns transport, storage and rendering. */
  chat: GenUIChatClient
  placeholder?: string
  /** Shown in place of the message list while the transcript is empty. */
  empty?: string
  disabled?: boolean
}>(), {
  disabled: false
})

const slots = useSlots()
const input = ref('')

// Refs nested in a prop are not unwrapped by the template, so expose computeds.
const messages = computed(() => props.chat.messages.value)
const status = computed(() => props.chat.status.value)
const error = computed(() => props.chat.error.value)
const messageSlots = computed(() => activeSlots(MESSAGE_SLOTS, slots))

function onSubmit(event: Event) {
  event.preventDefault()
  const text = input.value.trim()
  input.value = ''
  if (!text) return
  props.chat.sendMessage({ text })
}

function stop() { props.chat.stop() }
function regenerate() { props.chat.regenerate() }
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-2">
    <div v-if="messages.length === 0 && (empty || slots.empty)" class="flex flex-1 items-center justify-center text-sm text-muted">
      <slot name="empty">{{ empty }}</slot>
    </div>
    <ChatMessages
      v-else
      :messages="(messages as never)"
      :status="(status as never)"
    >
      <template v-for="slot in messageSlots" #[slot]="slotProps">
        <slot :name="slot" v-bind="slotProps" />
      </template>
    </ChatMessages>

    <ChatPrompt
      v-model="input"
      :error="error"
      :disabled="disabled"
      :placeholder="placeholder"
      @submit="onSubmit"
    >
      <template v-if="slots['prompt-header']" #header="slotProps">
        <slot name="prompt-header" v-bind="slotProps" />
      </template>
      <template v-if="slots['prompt-body']" #body="slotProps">
        <slot name="prompt-body" v-bind="slotProps" />
      </template>
      <template #footer="slotProps">
        <slot v-if="slots['prompt-footer']" name="prompt-footer" v-bind="slotProps" />
        <ChatPromptSubmit
          v-else
          :status="(status as never)"
          :disabled="disabled"
          @stop="stop"
          @reload="regenerate"
        />
      </template>
    </ChatPrompt>
  </div>
</template>

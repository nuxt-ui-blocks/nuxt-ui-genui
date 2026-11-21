import type { Component } from 'vue'
import RawChatMessages from '@nuxt/ui/components/ChatMessages.vue'
import RawChatPrompt from '@nuxt/ui/components/ChatPrompt.vue'
import RawChatPromptSubmit from '@nuxt/ui/components/ChatPromptSubmit.vue'

/**
 * Nuxt UI's chat component declarations reference the AI SDK's `ChatStatus`.
 * GenUI never imports or re-exports that type, so widen the components to
 * Vue's generic `Component` here: no `ai` type can leak into our declarations.
 */
export const ChatMessages: Component = RawChatMessages
export const ChatPrompt: Component = RawChatPrompt
export const ChatPromptSubmit: Component = RawChatPromptSubmit

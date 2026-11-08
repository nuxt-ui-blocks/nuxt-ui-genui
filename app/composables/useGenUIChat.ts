import type { ActionEvent } from '@openuidev/vue-lang'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  ui?: string
}

export function useGenUIChat() {
  const messages = ref<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Ask me to create a dashboard. The demo uses a deterministic mock transport; connect a model provider to make generation dynamic.'
    }
  ])
  const isStreaming = ref(false)
  const error = ref<string | null>(null)

  async function sendMessage(prompt: string) {
    const content = prompt.trim()
    if (!content || isStreaming.value) return

    error.value = null
    messages.value.push({ id: crypto.randomUUID(), role: 'user', text: content })
    isStreaming.value = true

    const assistant: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      text: 'I generated a dashboard interface from the request.',
      ui: ''
    }
    messages.value.push(assistant)

    try {
      const result = await $fetch<{ ui: string }>('/api/genui/demo', {
        method: 'POST',
        body: { prompt: content }
      })
      assistant.ui = result.ui
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Generation failed.'
      assistant.text = 'I could not generate the interface.'
    } finally {
      isStreaming.value = false
    }
  }

  function handleAction(event: ActionEvent) {
    // OpenUI continuation actions are converted into normal chat turns.
    if (event.humanFriendlyMessage) {
      void sendMessage(event.humanFriendlyMessage)
    }
  }

  return { messages, isStreaming, error, sendMessage, handleAction }
}

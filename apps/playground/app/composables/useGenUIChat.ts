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
      text: 'Ask me to create a dashboard. I use OpenAI to generate the UI — /api/genui/demo is kept as an offline deterministic demo.'
    }
  ])
  const isStreaming = ref(false)
  const error = ref<string | null>(null)

  async function sendMessage(prompt: string) {
    const content = prompt.trim()
    if (!content || isStreaming.value) return

    error.value = null
    // Snapshot prior turns before pushing the new user/assistant entries, so the
    // request carries history + the new user turn exactly once.
    const history = messages.value
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role, content: m.text }))
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
      const result = await $fetch<{ ui: string }>('/api/genui/chat', {
        method: 'POST',
        body: { messages: [...history, { role: 'user', content }] }
      })
      assistant.ui = result.ui
    } catch (cause) {
      const data = (cause as { data?: { error?: string; statusMessage?: string } } | null)?.data
      error.value =
        data?.error ??
        data?.statusMessage ??
        (cause instanceof Error ? cause.message : 'Generation failed.')
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

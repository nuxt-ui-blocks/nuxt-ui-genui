import type { ActionEvent } from '@openuidev/vue-lang'
import type { UIMessage, TextUIPart, DataUIPart } from 'ai'
import { streamChat } from '../utils/streamChat'

export type GenUIChatStatus = 'submitted' | 'streaming' | 'ready' | 'error'

type GenUIDataParts = { genui: { ui: string } }
export type GenUIChatMessage = UIMessage<unknown, GenUIDataParts>

const WELCOME =
  'Ask me to create a dashboard. I use OpenAI to generate the UI — /api/genui/demo is kept as an offline deterministic demo.'
const GENERATED = 'I generated a dashboard interface from the request.'
const FAILED = 'I could not generate the interface.'

function textOf(message: GenUIChatMessage): string {
  return message.parts
    .filter((p): p is TextUIPart => p.type === 'text')
    .map((p) => p.text)
    .join('\n')
}

export function useGenUIChat() {
  const messages = ref<GenUIChatMessage[]>([
    { id: 'welcome', role: 'assistant', parts: [{ type: 'text', text: WELCOME }] }
  ])
  const status = ref<GenUIChatStatus>('ready')
  const error = ref<string | null>(null)
  const renderError = ref<string | null>(null)
  const isStreaming = computed(() => status.value === 'submitted' || status.value === 'streaming')

  function findAssistant(id: string): GenUIChatMessage | undefined {
    return messages.value.find((m) => m.id === id)
  }

  async function sendMessage(prompt: string) {
    const content = prompt.trim()
    if (!content || isStreaming.value) return

    error.value = null
    renderError.value = null // F7 — clear on every turn, including action-triggered ones

    const history = messages.value
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: textOf(m) }))

    messages.value.push({ id: crypto.randomUUID(), role: 'user', parts: [{ type: 'text', text: content }] })

    const assistantId = crypto.randomUUID()
    messages.value.push({ id: assistantId, role: 'assistant', parts: [{ type: 'text', text: GENERATED }] })
    status.value = 'submitted'

    const assistant = findAssistant(assistantId)!
    let genuiIndex = -1
    let uiBuffer = ''

    const writeUi = (ui: string) => {
      const dataPart = { type: 'data-genui', data: { ui } } as DataUIPart<GenUIDataParts>
      if (genuiIndex === -1) {
        assistant.parts = [...assistant.parts, dataPart]
        genuiIndex = assistant.parts.length - 1
      } else {
        const next = [...assistant.parts]
        next[genuiIndex] = dataPart
        assistant.parts = next
      }
    }

    const failWith = (message: string) => {
      status.value = 'error'
      error.value = message
      assistant.parts = assistant.parts.map((p) =>
        p.type === 'text' ? { ...p, text: FAILED } : p
      )
    }

    try {
      await streamChat(
        { messages: [...history, { role: 'user', content }] },
        (event) => {
          if (event.type === 'chunk') {
            uiBuffer += event.text
            if (status.value === 'submitted') status.value = 'streaming'
            writeUi(uiBuffer)
          } else if (event.type === 'done') {
            writeUi(event.ui) // canonical, fence-stripped Lang
            status.value = 'ready'
          } else {
            failWith(
              event.reason === 'boundary'
                ? `Model output failed validation:\n${event.issues.join('\n')}`
                : event.issues[0] ?? 'The model provider request failed.'
            )
          }
        }
      )
    } catch (cause) {
      failWith(cause instanceof Error ? cause.message : 'Generation failed.')
    }
  }

  function handleAction(event: ActionEvent) {
    if (event.humanFriendlyMessage) {
      void sendMessage(event.humanFriendlyMessage)
    }
  }

  function setRenderError(message: string | null) {
    renderError.value = message
  }

  return { messages, status, isStreaming, error, renderError, sendMessage, handleAction, setRenderError }
}

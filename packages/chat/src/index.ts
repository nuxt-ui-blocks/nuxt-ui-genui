import { ref, type Ref } from 'vue'
import { createFetchTransport, type GenUITransport } from './transport'
import { collectAssistantText, isAssistantActive, isPartStreaming, isReasoningPart, isTextPart, latestAssistantText } from './parts'
import type { GenUIChatStorage } from './storage'
import type { GenUIChatStatus, GenUIMessage, GenUISendInput } from './types'

export * from './types'
export * from './parts'
export { createLocalStorageAdapter, type GenUIStorageLike, type GenUIChatStorage } from './storage'
export { createFetchTransport, type GenUITransport, type GenUITransportInput, type GenUIFetchTransportOptions } from './transport'

export interface GenUIChat {
  /** The conversation, oldest first. */
  messages: Ref<GenUIMessage[]>
  /** `ready` | `submitted` | `streaming` | `error`. */
  status: Ref<GenUIChatStatus>
  /** The last transport error, if any. */
  error: Ref<Error | undefined>
  /** Send one turn. Ignored while a response is in flight. */
  sendMessage(input: GenUISendInput): void
  /** Stop the running response; the partial text stays in the transcript. */
  stop(): void
  /** Drop the last assistant answer and ask for it again. */
  regenerate(): void
  /** Empty the transcript. */
  clear(): void
}

export interface GenUIChatOptions {
  /** Chat endpoint. Ignored when `transport` is given. */
  api?: string
  /** Custom transport: any source of OpenUI Lang text. */
  transport?: GenUITransport
  /** Restored history. */
  messages?: GenUIMessage[]
  /** Forwarded to the default transport as request headers. */
  headers?: Record<string, string> | Headers
  /** Fetch credentials mode of the default transport. */
  credentials?: RequestCredentials
  /** Injectable fetch for the default transport (tests, custom agents). */
  fetch?: typeof globalThis.fetch
  /**
   * Optional transcript persistence. When omitted, behavior is unchanged.
   * When `messages` is also given, the explicit history wins over hydration.
   */
  storage?: GenUIChatStorage
}

let counter = 0
function nextId(prefix: string): string {
  counter += 1
  const random = typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10)
  return `${prefix}-${counter}-${random}`
}

/**
 * A chat client that is not tied to any agent framework.
 *
 * The default transport POSTs to an HTTP route and reads the response as
 * OpenUI Lang text; any backend works (the Vercel AI SDK adapter, LangGraph,
 * Google ADK, Mastra, AG-UI, OpenUI Cloud, ...). The message shape matches the
 * one Nuxt UI's chat components expect, so the transcript can be handed to
 * `<UChatMessages>` unchanged.
 */
export function createGenUIChat(options: GenUIChatOptions = {}): GenUIChat {
  const { api = '/api/chat', transport, messages, headers, credentials, fetch: fetchImpl, storage } = options
  const send = transport ?? createFetchTransport({ api, headers, credentials, fetch: fetchImpl })

  const state = ref<GenUIMessage[]>(messages ? [...messages] : [])
  const status = ref<GenUIChatStatus>('ready')
  const error = ref<Error | undefined>()

  let controller: AbortController | undefined
  let running = false

  // Optional persistence. With no storage configured every hook below is a
  // no-op, so the client behaves exactly as before.
  let userActed = false
  let generation = 0

  function snapshot(): GenUIMessage[] {
    // Detach from Vue's reactive proxies so adapters receive plain data.
    return state.value.map(message => ({ ...message, parts: [...message.parts] }))
  }

  function bestEffort(task: () => unknown): void {
    // A microtask (not a timer) keeps tests deterministic and coalesces all
    // mutations in the same turn into a single write. Storage must never turn
    // into a chat error, so sync throws and rejected promises are swallowed.
    try { void Promise.resolve().then(task).catch(() => {}) } catch { /* ignore */ }
  }

  function scheduleSave(): void {
    if (!storage) return
    const token = ++generation
    bestEffort(() => {
      if (token === generation) return storage?.save(snapshot())
    })
  }

  function scheduleClear(): void {
    if (!storage) return
    const token = ++generation
    bestEffort(() => {
      if (token === generation) return storage?.clear()
    })
  }

  if (storage && messages === undefined) {
    bestEffort(async () => {
      const loaded = await storage?.load()
      if (userActed || !Array.isArray(loaded)) return
      state.value = loaded
    })
  }

  async function run(history: GenUIMessage[]) {
    if (running) return
    running = true
    controller = new AbortController()
    status.value = 'submitted'
    error.value = undefined

    const answer: GenUIMessage = {
      id: nextId('assistant'),
      role: 'assistant',
      parts: [{ type: 'text', text: '', state: 'streaming' }]
    }
    state.value = [...state.value, answer]
    // Read the part back through the reactive proxy: mutating the raw object
    // would bypass Vue's tracking and the transcript would not update while
    // the response streams in.
    const reactiveAnswer = state.value[state.value.length - 1]!
    const part = reactiveAnswer.parts[0] as { type: 'text', text: string, state?: 'streaming' | 'done' }

    try {
      for await (const raw of await send({ messages: history, signal: controller.signal })) {
        const text = typeof raw === 'string' ? raw : raw.text
        const mode = typeof raw === 'string' ? 'delta' : raw.mode
        if (!text) continue
        part.text = mode === 'snapshot' ? text : part.text + text
        if (status.value !== 'streaming') status.value = 'streaming'
      }
    } catch (e) {
      // A stopped turn is not an error: the user asked for it.
      if (!controller.signal.aborted) {
        error.value = e instanceof Error ? e : new Error(String(e))
        status.value = 'error'
      }
    } finally {
      part.state = 'done'
      if (status.value !== 'error') status.value = 'ready'
      running = false
      controller = undefined
      scheduleSave()
    }
  }

  function sendMessage(input: GenUISendInput) {
    if (running) return
    const text = input.text?.trim() ?? ''
    const files = input.files ?? []
    if (!text && files.length === 0) return

    userActed = true
    const message: GenUIMessage = {
      id: nextId('user'),
      role: 'user',
      parts: [{ type: 'text', text, state: 'done' }, ...files]
    }
    const history = [...state.value, message]
    state.value = history
    void run(history)
    scheduleSave()
  }

  function stop() {
    controller?.abort()
    scheduleSave()
  }

  function regenerate() {
    if (running) return
    const history = [...state.value]
    if (history.at(-1)?.role === 'assistant') history.pop()
    userActed = true
    state.value = history
    void run(history)
    scheduleSave()
  }

  function clear() {
    controller?.abort()
    userActed = true
    state.value = []
    error.value = undefined
    status.value = 'ready'
    scheduleClear()
  }

  return {
    messages: state,
    status,
    error,
    sendMessage,
    stop,
    regenerate,
    clear
  }
}

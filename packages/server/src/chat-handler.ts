import { generateGenUISystemPrompt, toTextStreamResponse } from '@nuxt-ui-genui/core'
import type { GenUIPromptOptions } from '@nuxt-ui-genui/core'
import type {
  GenUIChatLibrary,
  GenUIMessageRecord,
  GenUINormalizedMessage,
  GenUIToolSpec,
  GenUISender
} from './types'
import {
  DEFAULT_REQUEST_LIMITS,
  jsonResponse,
  messageRole,
  messageText,
  readJsonObject,
  type GenUIRequestLimits
} from './http'

export interface CreateGenUIChatHandlerOptions {
  /** Server-safe library; renderers are irrelevant here. */
  library: GenUIChatLibrary
  /**
   * Tools advertised to the model. Defaults to the tools stored on the library,
   * then to `promptOptions.tools`. Only the prompt is built here — execution
   * belongs in `createGenUIToolHandler`.
   */
  tools?: readonly GenUIToolSpec[]
  /** Call any model backend here; return the program text or a stream of it. */
  sender: GenUISender
  /** Override the generated prompt entirely when needed. */
  systemPrompt?: string
  /** Extra prompt options merged under `tools`. */
  promptOptions?: GenUIPromptOptions
  /** Bounds for request bodies and messages. Defaults are safe for public endpoints. */
  limits?: GenUIRequestLimits
}

export type GenUIChatHandler = (request: Request) => Promise<Response>

async function* singleChunk(text: string): AsyncGenerator<string> {
  yield text
}

/**
 * Build a Web-standard chat endpoint. Nothing in this module imports a model
 * SDK or reads the environment: the host injects the sender, so the same
 * handler works with Vercel AI SDK, a plain fetch, LangGraph or a mock.
 */
export function createGenUIChatHandler(options: CreateGenUIChatHandlerOptions): GenUIChatHandler {
  const { library, sender } = options
  const limits = { ...DEFAULT_REQUEST_LIMITS, ...options.limits }

  return async (request: Request): Promise<Response> => {
    const read = await readJsonObject(request, limits.maxBodyBytes)
    if (!read.ok) {
      return jsonResponse({ error: read.error }, read.status)
    }
    const body = read.value
    if (!Array.isArray(body.messages)) {
      return jsonResponse({ error: 'Request body must contain a "messages" array.' }, 400)
    }

    const rawMessages = body.messages as unknown[]
    if (rawMessages.length > limits.maxMessages) {
      return jsonResponse({ error: `Too many messages (maximum ${limits.maxMessages}).` }, 413)
    }

    const messages: GenUINormalizedMessage[] = []
    for (const raw of rawMessages) {
      const content = messageText(raw)
      if (content === null) {
        return jsonResponse(
          { error: 'Every message must be a string or an object with content or parts.' },
          400
        )
      }
      if (!content.trim()) continue
      if (content.length > limits.maxMessageChars) {
        return jsonResponse({ error: `A message exceeds ${limits.maxMessageChars} characters.` }, 413)
      }
      messages.push({ role: messageRole(raw as GenUIMessageRecord), content })
    }
    if (!messages.length) {
      return jsonResponse({ error: 'At least one non-empty message is required.' }, 400)
    }

    const tools = options.tools ?? options.promptOptions?.tools ?? library.promptOptions?.tools
    const systemPrompt = options.systemPrompt
      ?? generateGenUISystemPrompt(library, {
        ...options.promptOptions,
        ...(tools ? { tools } : {})
      })

    const result = await sender({ systemPrompt, messages, signal: request.signal })
    const chunks = typeof result === 'string' ? singleChunk(result) : result
    return toTextStreamResponse(chunks)
  }
}

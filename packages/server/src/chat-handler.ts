import { generateGenUISystemPrompt, toTextStreamResponse } from '@nuxt-ui-genui/core'
import type { GenUIPromptOptions } from '@nuxt-ui-genui/core'
import type {
  GenUIChatLibrary,
  GenUIMessageRecord,
  GenUINormalizedMessage,
  GenUIToolSpec,
  GenUISender
} from './types'
import { jsonResponse, messageRole, messageText, readJsonObject } from './http'

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

  return async (request: Request): Promise<Response> => {
    const body = await readJsonObject(request)
    if (!body || !Array.isArray(body.messages)) {
      return jsonResponse({ error: 'Request body must contain a "messages" array.' }, 400)
    }

    const messages: GenUINormalizedMessage[] = []
    for (const raw of body.messages as unknown[]) {
      const content = messageText(raw)
      if (content === null) {
        return jsonResponse(
          { error: 'Every message must be a string or an object with content or parts.' },
          400
        )
      }
      if (!content.trim()) continue
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

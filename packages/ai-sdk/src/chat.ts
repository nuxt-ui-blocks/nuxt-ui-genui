import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport, TextStreamChatTransport } from 'ai'
import type { ChatTransport, UIMessage } from 'ai'

/**
 * Wire protocol for the endpoint behind the AI SDK chat.
 *
 * - `text` (default): plain text stream of OpenUI Lang tokens. What the GenUI
 *   framework serves anywhere (`/api/chat`, `streamGenUIText`, or any other
 *   backend that streams OpenUI Lang over `text/plain` or chunked SSE body).
 * - `ui-stream`: the AI SDK UI message stream protocol (SSE `data:` JSON chunks,
 *   i.e. what `streamGenUI()` serves behind `?format=ui-stream`).
 */
export type GenUIChatProtocol = 'text' | 'ui-stream'

export interface GenUIChatOptions {
  /** Chat API endpoint; the playground serves /api/chat. */
  api?: string
  /**
   * Wire protocol for the endpoint. Defaults to 'text' (plain OpenUI Lang),
   * matching the framework's default and the playground's `/api/chat`.
   * Use 'ui-stream' when the endpoint speaks the AI SDK UI message stream
   * (e.g. `?format=ui-stream` or a `streamGenUI()` response).
   */
  protocol?: GenUIChatProtocol
  /**
   * Custom transport override. Wins over `protocol` when set, so hosts on other
   * backends (LangGraph, Mastra, ADK, AG-UI, an OpenUI Cloud endpoint) can bring
   * any `ChatTransport<UIMessage>` implementation without changing this package.
   */
  transport?: ChatTransport<UIMessage>
  /** Forwarded to the transport (headers, credentials). Ignored when `transport` is set. */
  headers?: Record<string, string> | Headers
  /** Fetch credentials mode: 'omit' | 'same-origin' | 'include'. Ignored when `transport` is set. */
  credentials?: RequestCredentials
  /** Restored history; try/catch at the callsite for persisted state. */
  messages?: UIMessage[]
}

/**
 * The Vercel AI SDK flavour of the GenUI chat client.
 *
 * `createGenUIChat` in `@nuxt-ui-genui/chat` is framework-agnostic and talks to
 * any backend that streams OpenUI Lang text. Use this one when the host already
 * runs the AI SDK (it brings the `Chat` class and `UIMessage` type from `ai`,
 * and the transports below).
 *
 * By default the adapter streams plain OpenUI Lang (`protocol: 'text'` →
 * `TextStreamChatTransport`), so the same `/api/chat` endpoint works without an
 * Accept header negotiation dance. Set `protocol: 'ui-stream'` (or pass your
 * own `transport`) if your endpoint speaks the AI SDK UI message stream instead.
 */
export function createAIChat(options: GenUIChatOptions = {}) {
  const { api = '/api/chat', protocol = 'text', transport, headers, credentials, messages } = options

  const resolvedTransport = transport
    ?? (protocol === 'ui-stream'
      ? new DefaultChatTransport<UIMessage>({
          api,
          ...(headers ? { headers } : {}),
          ...(credentials ? { credentials } : {})
        })
      : new TextStreamChatTransport<UIMessage>({
          api,
          ...(headers ? { headers } : {}),
          ...(credentials ? { credentials } : {})
        }))

  return new Chat<UIMessage>({
    ...(messages ? { messages } : {}),
    transport: resolvedTransport
  })
}

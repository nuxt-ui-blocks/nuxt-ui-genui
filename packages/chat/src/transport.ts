import { responseChunks, type GenUIStreamChunk } from '@nuxt-ui-genui/core'
import type { GenUIMessage } from './types'

/** One chat turn handed to a transport. */
export interface GenUITransportInput {
  /** The conversation so far, oldest first. */
  messages: GenUIMessage[]
  /** Aborts the turn when the user stops the response. */
  signal?: AbortSignal
}

/**
 * A transport turns a conversation into a stream of OpenUI Lang text.
 *
 * The host chooses the backend: the default one POSTs to an HTTP route, but
 * any async iterable of text works (LangGraph, Google ADK, Mastra, AG-UI,
 * OpenUI Cloud, the Vercel AI SDK adapter, ...).
 *
 * A custom transport **must observe `input.signal`**: aborting it is how
 * `stop()` ends a turn (the built-in transport aborts the HTTP request).
 *
 * Compatibility note: this type was widened from `string` to
 * `string | GenUIStreamChunk`. The change is additive — a transport that
 * yields plain strings keeps working unchanged. A `GenUIStreamChunk` with
 * `mode: 'snapshot'` replaces the running answer instead of appending to it,
 * for agent engines that re-emit the full history on every event.
 */
export type GenUITransport = (input: GenUITransportInput) => AsyncIterable<string | GenUIStreamChunk> | Promise<AsyncIterable<string | GenUIStreamChunk>>

export interface GenUIFetchTransportOptions {
  /** Chat endpoint that receives `{ messages }` and streams OpenUI Lang back. */
  api: string
  headers?: Record<string, string> | Headers
  /** Fetch credentials mode: 'omit' | 'same-origin' | 'include'. */
  credentials?: RequestCredentials
  /** Injectable fetch (tests, SSR, custom agents). */
  fetch?: typeof globalThis.fetch
}

/**
 * Default transport: POST the conversation and read the response as text.
 *
 * The response may be `text/plain` (raw OpenUI Lang), `text/event-stream` (SSE)
 * or `application/x-ndjson` - all three are read as plain text chunks.
 */
export function createFetchTransport(options: GenUIFetchTransportOptions): GenUITransport {
  const { api, headers, credentials, fetch: fetchImpl = globalThis.fetch } = options
  return async function transport(input) {
    const response = await fetchImpl(api, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(headers instanceof Headers ? Object.fromEntries(headers.entries()) : headers ?? {})
      },
      ...(credentials ? { credentials } : {}),
      body: JSON.stringify({ messages: input.messages }),
      signal: input.signal
    })
    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      throw new Error(`Chat request failed (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`)
    }
    return responseChunks(response)
  }
}

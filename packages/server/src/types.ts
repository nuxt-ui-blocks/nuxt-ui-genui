import type { GenUIPromptOptions, GenUIToolSpec } from '@nuxt-ui-genui/core'

export type { GenUIToolSpec } from '@nuxt-ui-genui/core'

/** The server-safe side of a GenUI library: no renderers, no Vue components. */
export interface GenUIChatLibrary {
  toSpec(): unknown
  promptOptions?: GenUIPromptOptions
}

/** One incoming message, kept close to the AI SDK `UIMessage` shape. */
export interface GenUIMessageRecord {
  role?: unknown
  content?: unknown
  parts?: unknown
  [key: string]: unknown
}

export interface GenUINormalizedMessage {
  role: string
  content: string
}

export interface GenUISendRequest {
  systemPrompt: string
  messages: GenUINormalizedMessage[]
  signal?: AbortSignal
}

/** A sender returns either the full program or a stream of program chunks. */
export type GenUISendResult = string | AsyncIterable<string>

export type GenUISender = (request: GenUISendRequest) => GenUISendResult | Promise<GenUISendResult>

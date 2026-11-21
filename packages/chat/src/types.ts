/**
 * Message shapes used by the GenUI chat client.
 *
 * The shape mirrors the Vercel AI SDK's `UIMessage` on purpose: Nuxt UI's chat
 * components (`UChatMessages`, `UChatPrompt`, ...) are typed against it, so a
 * GenUI message can be handed to them unchanged. The types are declared here
 * instead of imported so no AI SDK code is required at runtime - OpenUI works
 * with any agent backend (LangGraph, Google ADK, Mastra, AG-UI, OpenUI Cloud,
 * a plain HTTP route, ...).
 */

export interface GenUITextPart {
  type: 'text'
  text: string
  /** `streaming` while the part is still being written. */
  state?: 'streaming' | 'done'
}

export interface GenUIReasoningPart {
  type: 'reasoning'
  text: string
  state?: 'streaming' | 'done'
}

export interface GenUIFilePart {
  type: 'file'
  mediaType: string
  filename?: string
  url: string
}

export type GenUIMessagePart = GenUITextPart | GenUIReasoningPart | GenUIFilePart

export interface GenUIMessage {
  id: string
  role: 'system' | 'user' | 'assistant'
  parts: GenUIMessagePart[]
  metadata?: Record<string, unknown>
  system?: string
}

export type GenUIChatStatus = 'ready' | 'submitted' | 'streaming' | 'error'

/** Input of one chat turn. */
export interface GenUISendInput {
  text?: string
  files?: GenUIFilePart[]
}

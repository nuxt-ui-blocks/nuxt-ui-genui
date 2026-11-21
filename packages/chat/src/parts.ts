import type { GenUIChatStatus, GenUIMessage, GenUIMessagePart } from './types'

/** True for a text part. */
export function isTextPart(part: { type?: string } | null | undefined): part is Extract<GenUIMessagePart, { type: 'text' }> {
  return part?.type === 'text'
}

/** True for a reasoning part. */
export function isReasoningPart(part: { type?: string } | null | undefined): part is Extract<GenUIMessagePart, { type: 'reasoning' }> {
  return part?.type === 'reasoning'
}

/**
 * True while the part is still being written.
 *
 * Same rule as Nuxt UI's own `isPartStreaming` helper (`part.state ===
 * 'streaming'`), re-declared here so the chat package does not depend on the
 * AI SDK that Nuxt UI's chat components are typed against.
 */
export function isPartStreaming(part: { state?: string } | null | undefined): boolean {
  return part?.state === 'streaming'
}

/** Join all text parts of a message; non-text parts are ignored. */
export function collectAssistantText(message: { parts?: GenUIMessagePart[] } | null | undefined): string {
  if (!message?.parts) return ''
  return message.parts.filter(isTextPart).map(part => part.text).join('')
}

/** Text of the last assistant message; used to key a renderer against a stable response string. */
export function latestAssistantText(messages: { role: string; parts?: GenUIMessagePart[] }[] | null | undefined): string {
  if (!messages) return ''
  const last = [...messages].reverse().find(m => m.role === 'assistant')
  return collectAssistantText(last)
}

/** True while the assistant is mid-response (ready=false, nothing to stop). */
export function isAssistantActive(status: GenUIChatStatus | (string & {}) | undefined): boolean {
  return status === 'submitted' || status === 'streaming'
}

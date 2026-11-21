import { createPlaygroundLibrary, promptOptions } from '~/lib/library'
import { generateGenUISystemPrompt } from '@nuxt-ui-genui/core'
import { streamGenUI, streamGenUIText } from '@nuxt-ui-genui/ai-sdk'
import { resolveGenUILive, resolveGenUIMock } from '../utils/genai'
import { pickProgram } from '~/lib/demo-program'

const library = createPlaygroundLibrary()
const systemPrompt = generateGenUISystemPrompt(library, promptOptions)

export default defineEventHandler(async (event) => {
  const body = await readBody<{ messages?: unknown }>(event)
  if (!body || !Array.isArray(body.messages)) {
    throw createError({ statusCode: 400, statusMessage: 'Request body must be { "messages": [...] }' })
  }
  const messages = body.messages as never[]

  // Plain OpenUI Lang text is the default: any agent backend can produce it and
  // any GenUI client can read it. `?format=ui-stream` speaks the Vercel AI SDK's
  // UI-message-stream protocol for hosts that use the AI SDK adapter. Hosts that
  // run the AI SDK's `DefaultChatTransport` send `Accept: text/event-stream`, so
  // honour that too — the framework-agnostic client (`createFetchTransport`) sends
  // no Accept header and stays on the text protocol.
  const accept = String(getRequestHeader(event, 'accept') ?? event.node.req.headers.accept ?? '')
  const format = getQuery(event).format === 'ui-stream' || /(^|,)\s*text\/event-stream\s*(,|$)/.test(accept)
    ? 'ui-stream'
    : 'text'
  const stream = format === 'ui-stream' ? streamGenUI : streamGenUIText

  // The deterministic demo is opt-in: GENAI_MOCK=1 (or the legacy GENAI_LIVE=0).
  if (resolveGenUIMock(process.env)) {
    const userText = messages
      .map((m) => (Array.isArray((m as { parts?: { text?: string }[] }).parts) ? (m as { parts: { text?: string }[] }).parts.map((p) => p?.text ?? '').join(' ') : ''))
      .join(' ')
    return stream({ systemPrompt, messages, mockProgram: pickProgram(userText) })
  }

  // Live path: a generic OpenAI-compatible endpoint only. Never a verified hosted Thesys claim.
  const live = resolveGenUILive(process.env)
  if (!live) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Live model not configured. Set GENAI_API_KEY (plus optional GENAI_BASE_URL / GENAI_MODEL) in apps/playground/.env, or run with GENAI_MOCK=1 for the deterministic demo.'
    })
  }
  return stream({ systemPrompt, messages, live })
})

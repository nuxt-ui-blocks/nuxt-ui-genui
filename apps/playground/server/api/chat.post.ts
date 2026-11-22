import { createPlaygroundLibrary, promptOptions } from '~/lib/library'
import { generateGenUISystemPrompt } from '@nuxt-ui-genui/core'
import { pickProgram } from '~/lib/demo-program'
import { GenUIProviderConfigError, planChatRequest, resolveGenUIProvider } from '../utils/provider'

const library = createPlaygroundLibrary()

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

  const userText = messages
    .map((m) => (Array.isArray((m as { parts?: { text?: string }[] }).parts) ? (m as { parts: { text?: string }[] }).parts.map((p) => p?.text ?? '').join(' ') : ''))
    .join(' ')

  let config
  try {
    config = resolveGenUIProvider(process.env)
  } catch (error) {
    if (error instanceof GenUIProviderConfigError) {
      throw createError({ statusCode: 503, statusMessage: error.message })
    }
    throw error
  }
  const systemPrompt = generateGenUISystemPrompt(library, { ...promptOptions, cloud: config.cloud })
  try {
    const plan = planChatRequest({
      config,
      format,
      messages,
      systemPrompt,
      mockProgram: pickProgram(userText)
    })
    return plan.stream(plan.options)
  } catch (error) {
    if (error instanceof GenUIProviderConfigError) {
      throw createError({ statusCode: 503, statusMessage: error.message })
    }
    throw error
  }
})

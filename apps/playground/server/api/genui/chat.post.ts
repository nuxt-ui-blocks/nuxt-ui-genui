import type { StreamEvent } from '../../utils/genuiAdapter'
import { createEventStream } from 'h3'
import {
  AdapterConfigError,
  ChatRequestSchema,
  streamUi
} from '../../utils/genuiAdapter'

const PROVIDER_FAILURE_MESSAGE =
  'The model provider request failed. Check OPENAI_API_KEY / OPENAI_MODEL and try again.'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = ChatRequestSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'Invalid request body. Expected { messages: [{ role, content }] } with role "user" or "assistant" and at least one message.'
    })
  }

  let stream: AsyncGenerator<StreamEvent>
  try {
    stream = await streamUi({ messages: parsed.data.messages })
  } catch (cause) {
    if (cause instanceof AdapterConfigError) {
      throw createError({ statusCode: 500, statusMessage: cause.message })
    }
    throw createError({ statusCode: 502, statusMessage: PROVIDER_FAILURE_MESSAGE })
  }

  const eventStream = createEventStream(event)

  ;(async () => {
    try {
      for await (const evt of stream) {
        if (evt.type === 'chunk') {
          await eventStream.push({ event: 'chunk', data: JSON.stringify({ text: evt.text }) })
        } else if (evt.type === 'done') {
          await eventStream.push({
            event: 'done',
            data: JSON.stringify({ ok: true, ui: evt.ui, meta: evt.meta })
          })
        } else {
          await eventStream.push({
            event: 'error',
            data: JSON.stringify({ ok: false, issues: evt.issues, reason: evt.reason })
          })
        }
      }
    } catch {
      await eventStream.push({
        event: 'error',
        data: JSON.stringify({ ok: false, issues: [PROVIDER_FAILURE_MESSAGE], reason: 'provider' })
      })
    } finally {
      await eventStream.close()
    }
  })()

  return eventStream.send()
})

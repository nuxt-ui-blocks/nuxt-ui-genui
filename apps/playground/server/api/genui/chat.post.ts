import {
  AdapterConfigError,
  ChatRequestSchema,
  generateUi
} from '../../utils/genuiAdapter'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = ChatRequestSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request body. Expected { messages: [{ role, content }] } with at least one message.'
    })
  }

  try {
    const result = await generateUi({ messages: parsed.data.messages })

    if (!result.ok) {
      throw createError({
        statusCode: 422,
        statusMessage: 'Model output failed validation.',
        data: {
          error: 'Model output could not be parsed as OpenUI Lang.',
          issues: result.issues
        }
      })
    }

    return { ui: result.ui, meta: result.meta }
  } catch (cause) {
    if (cause instanceof AdapterConfigError) {
      throw createError({ statusCode: 500, statusMessage: cause.message })
    }
    if (
      typeof cause === 'object' &&
      cause !== null &&
      'statusCode' in cause
    ) {
      throw cause
    }
    throw createError({
      statusCode: 502,
      statusMessage: 'The model provider request failed. Check OPENAI_API_KEY / OPENAI_MODEL and try again.'
    })
  }
})

import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { operationSchema, recordOperation } from '../utils/audit'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = operationSchema.safeParse(body)
  if (!parsed.success) {
    setResponseStatus(event, 400)
    return { ok: false, error: 'Expected { formId: string, values: object }' }
  }
  const recorded = await recordOperation(parsed.data)
  return { ok: true, ts: recorded.ts }
})

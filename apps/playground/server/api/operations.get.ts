import { defineEventHandler, getQuery } from 'h3'
import { listOperations } from '../utils/audit'

export default defineEventHandler(async (event) => {
  const { limit } = getQuery(event)
  const parsedLimit = Number(limit)
  const events = await listOperations(Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 200) : 50)
  return { ok: true, events }
})

import { defineEventHandler } from 'h3'
import { resolveGenUILive, resolveGenUIMock } from '../utils/genai'

/** Client-visible provider badge state. Never exposes the API key. */
export default defineEventHandler(() => {
  const mock = resolveGenUIMock(process.env)
  const live = mock ? undefined : resolveGenUILive(process.env)
  return { live: Boolean(live), mock, model: live?.model }
})

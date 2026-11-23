import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createPlaygroundLibrary: vi.fn(() => ({ toSpec: () => ({ components: ['Card'] }) })),
  promptOptions: { examples: ['demo'] },
  generateGenUISystemPrompt: vi.fn(() => 'generated system prompt'),
  pickProgram: vi.fn(() => 'picked demo program'),
  streamGenUI: vi.fn(async (_options: { live?: { baseURL?: string } }) => new Response('ui')),
  streamGenUIText: vi.fn(async (_options: { mockProgram?: string; live?: unknown }) => new Response('text')),
  createError: vi.fn((options: { statusCode: number; statusMessage?: string }) => options)
}))

vi.mock('~/lib/library', () => ({
  createPlaygroundLibrary: mocks.createPlaygroundLibrary,
  promptOptions: mocks.promptOptions
}))
vi.mock('~/lib/demo-program', () => ({ pickProgram: mocks.pickProgram }))
vi.mock('@nuxt-ui-genui/core', () => ({ generateGenUISystemPrompt: mocks.generateGenUISystemPrompt }))
vi.mock('@nuxt-ui-genui/ai-sdk', () => ({
  streamGenUI: mocks.streamGenUI,
  streamGenUIText: mocks.streamGenUIText
}))

type Handler = (event: unknown) => Promise<unknown>

const ENV_KEYS = [
  'GENAI_PROVIDER',
  'GENAI_MOCK',
  'GENAI_LIVE',
  'GENAI_API_KEY',
  'GENAI_BASE_URL',
  'GENAI_MODEL',
  'THESYS_API_KEY'
] as const

const savedEnv = new Map<string, string | undefined>()

function setEnv(env: Record<string, string>): void {
  for (const key of ENV_KEYS) delete process.env[key]
  Object.assign(process.env, env)
}

async function importRoute(): Promise<Handler> {
  vi.resetModules()
  const { default: handler } = await import('../server/api/chat.post')
  return handler as unknown as Handler
}

function stubEvent(accept: string | undefined): Record<string, unknown> {
  vi.stubGlobal('defineEventHandler', (fn: unknown) => fn)
  vi.stubGlobal('readBody', vi.fn(async () => ({ messages: [{ role: 'user', parts: [{ text: 'hello' }] }] })))
  vi.stubGlobal('getQuery', vi.fn(() => ({})))
  vi.stubGlobal('getRequestHeader', vi.fn(() => accept))
  vi.stubGlobal('createError', mocks.createError)
  return { node: { req: { headers: {} } } }
}

describe('chat route through the provider plan', () => {
  beforeEach(() => {
    for (const key of ENV_KEYS) savedEnv.set(key, process.env[key])
    vi.clearAllMocks()
  })

  afterEach(() => {
    for (const [key, value] of savedEnv) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    vi.unstubAllGlobals()
  })

  it('uses the cloud system prompt and streamGenUI for OpenUI Cloud with an SSE accept header', async () => {
    setEnv({ GENAI_PROVIDER: 'openui-cloud', THESYS_API_KEY: 'test-key', GENAI_MODEL: 'openai/gpt-5' })
    const event = stubEvent('text/event-stream')
    const handler = await importRoute()

    await handler(event)

    expect(mocks.generateGenUISystemPrompt).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ cloud: true })
    )
    expect(mocks.streamGenUI).toHaveBeenCalledWith(
      expect.objectContaining({ live: expect.objectContaining({ baseURL: 'https://api.thesys.dev/v1/embed' }) })
    )
    expect(mocks.streamGenUIText).not.toHaveBeenCalled()
  })

  it('uses streamGenUIText when the request carries no SSE accept header', async () => {
    setEnv({ GENAI_PROVIDER: 'openui-cloud', THESYS_API_KEY: 'test-key', GENAI_MODEL: 'openai/gpt-5' })
    const event = stubEvent(undefined)
    const handler = await importRoute()

    await handler(event)

    expect(mocks.streamGenUIText).toHaveBeenCalledWith(
      expect.objectContaining({ live: expect.objectContaining({ baseURL: 'https://api.thesys.dev/v1/embed' }) })
    )
    expect(mocks.streamGenUI).not.toHaveBeenCalled()
  })

  it('streams the mock program through streamGenUIText with GENAI_MOCK=1', async () => {
    setEnv({ GENAI_MOCK: '1' })
    const event = stubEvent(undefined)
    const handler = await importRoute()

    await handler(event)

    const options = mocks.streamGenUIText.mock.calls[0]?.[0]
    expect(options?.mockProgram).toBe('picked demo program')
    expect(options?.live).toBeUndefined()
  })

  it('returns a 503 createError when no provider is configured', async () => {
    setEnv({})
    const event = stubEvent(undefined)
    const handler = await importRoute()

    await handler(event).catch(() => undefined)

    expect(mocks.createError).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 503 }))
  })
})

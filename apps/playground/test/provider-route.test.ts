import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type ProviderResponse = {
  provider?: string
  live?: boolean
  mock?: boolean
  model?: string
}

type Handler = (event: unknown) => Promise<ProviderResponse>

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

async function importHandler(): Promise<Handler> {
  vi.resetModules()
  const { default: handler } = await import('../server/api/provider.get')
  return handler as unknown as Handler
}

function stubEvent(): Record<string, unknown> {
  vi.stubGlobal('defineEventHandler', (fn: unknown) => fn)
  return { node: { req: { headers: {} } } }
}

describe('/api/provider', () => {
  beforeEach(() => {
    for (const key of ENV_KEYS) savedEnv.set(key, process.env[key])
  })

  afterEach(() => {
    for (const [key, value] of savedEnv) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    vi.unstubAllGlobals()
  })

  it('reports the OpenUI Cloud provider without leaking the API key', async () => {
    setEnv({ GENAI_PROVIDER: 'openui-cloud', THESYS_API_KEY: 'test-key', GENAI_MODEL: 'openai/gpt-5' })
    const event = stubEvent()
    const handler = await importHandler()

    const response = await handler(event)

    expect(response).toEqual({ provider: 'openui-cloud', live: true, mock: false, model: 'openai/gpt-5' })
    expect(response).not.toHaveProperty('apiKey')
    expect(JSON.stringify(response)).not.toContain('test-key')
  })

  it('falls back to the mock provider when the config is invalid', async () => {
    setEnv({ GENAI_PROVIDER: 'mystery-provider' })
    const event = stubEvent()
    const handler = await importHandler()

    const response = await handler(event)

    expect(response).toEqual({ provider: 'mock', live: false, mock: false })
  })
})

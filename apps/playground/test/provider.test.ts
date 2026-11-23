import { describe, expect, it } from 'vitest'
import { streamGenUI, streamGenUIText } from '@nuxt-ui-genui/ai-sdk'
import {
  GenUIProviderConfigError,
  planChatRequest,
  resolveGenUIProvider,
  type GenUIProviderConfig
} from '../server/utils/provider'

describe('resolveGenUIProvider', () => {
  it('returns openai-compatible when no GENAI_PROVIDER is set', () => {
    expect(resolveGenUIProvider({})).toEqual({
      provider: 'openai-compatible',
      mock: false,
      cloud: false,
      live: undefined
    })
  })

  it('returns mock when GENAI_MOCK=1', () => {
    const config = resolveGenUIProvider({ GENAI_MOCK: '1' })
    expect(config.provider).toBe('mock')
    expect(config.mock).toBe(true)
  })

  it('returns mock for GENAI_PROVIDER=mock and ignores the key', () => {
    const config = resolveGenUIProvider({ GENAI_PROVIDER: 'mock', GENAI_API_KEY: 'test-key' })
    expect(config.mock).toBe(true)
  })

  it('lets an explicit openai-compatible provider beat the legacy flags', () => {
    const config = resolveGenUIProvider({
      GENAI_PROVIDER: 'openai-compatible',
      GENAI_LIVE: '0',
      GENAI_API_KEY: 'test-key'
    })
    expect(config.live).toBeDefined()
    expect(config.mock).toBe(false)
  })

  it('throws the exact unknown-provider message', () => {
    expect(() => resolveGenUIProvider({ GENAI_PROVIDER: 'nope' })).toThrowError(
      'Unknown GENAI_PROVIDER "nope". Expected one of: mock, openai-compatible, openui-cloud.'
    )
  })

  it('throws the exact cloud key message', () => {
    expect(() => resolveGenUIProvider({ GENAI_PROVIDER: 'openui-cloud' })).toThrowError(
      'GENAI_PROVIDER=openui-cloud requires THESYS_API_KEY on the server.'
    )
  })

  it('throws the exact cloud model message', () => {
    expect(() => resolveGenUIProvider({ GENAI_PROVIDER: 'openui-cloud', THESYS_API_KEY: 'test-key' })).toThrowError(
      'GENAI_PROVIDER=openui-cloud requires GENAI_MODEL (for example openai/gpt-5).'
    )
  })

  it('returns the cloud live config when valid', () => {
    const config = resolveGenUIProvider({
      GENAI_PROVIDER: 'openui-cloud',
      THESYS_API_KEY: 'test-key',
      GENAI_MODEL: 'openai/gpt-5'
    })
    expect(config).toEqual({
      provider: 'openui-cloud',
      mock: false,
      cloud: true,
      live: { apiKey: 'test-key', baseURL: 'https://api.thesys.dev/v1/embed', model: 'openai/gpt-5' }
    })
  })
})

describe('planChatRequest', () => {
  const baseInput = {
    systemPrompt: 'system prompt',
    messages: [] as never[],
    mockProgram: 'program'
  }

  it('selects streamGenUIText for format text with a cloud config', () => {
    const config: GenUIProviderConfig = resolveGenUIProvider({
      GENAI_PROVIDER: 'openui-cloud',
      THESYS_API_KEY: 'test-key',
      GENAI_MODEL: 'openai/gpt-5'
    })
    const plan = planChatRequest({ ...baseInput, config, format: 'text' })
    expect(plan.stream).toBe(streamGenUIText)
    expect(plan.options.live).toEqual({
      apiKey: 'test-key',
      baseURL: 'https://api.thesys.dev/v1/embed',
      model: 'openai/gpt-5'
    })
  })

  it('selects streamGenUI for format ui-stream', () => {
    const config: GenUIProviderConfig = resolveGenUIProvider({
      GENAI_PROVIDER: 'openui-cloud',
      THESYS_API_KEY: 'test-key',
      GENAI_MODEL: 'openai/gpt-5'
    })
    const plan = planChatRequest({ ...baseInput, config, format: 'ui-stream' })
    expect(plan.stream).toBe(streamGenUI)
  })

  it('produces the mock options for a mock config', () => {
    const config: GenUIProviderConfig = resolveGenUIProvider({ GENAI_MOCK: '1' })
    const plan = planChatRequest({ ...baseInput, config, format: 'text' })
    expect(plan.options.mockProgram).toBe('program')
    expect(plan.options.live).toBeUndefined()
  })

  it('throws the exact 503 message when no live model is configured', () => {
    const config: GenUIProviderConfig = resolveGenUIProvider({})
    expect(() => planChatRequest({ ...baseInput, config, format: 'text' })).toThrowError(
      GenUIProviderConfigError
    )
    expect(() => planChatRequest({ ...baseInput, config, format: 'text' })).toThrowError(
      'Live model not configured. Set GENAI_API_KEY (plus optional GENAI_BASE_URL / GENAI_MODEL) in apps/playground/.env, or run with GENAI_MOCK=1 for the deterministic demo.'
    )
  })
})

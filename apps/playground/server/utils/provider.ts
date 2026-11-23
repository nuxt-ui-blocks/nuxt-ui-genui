import type { GenUILiveOptions, StreamGenUIOptions } from '@nuxt-ui-genui/ai-sdk'
import { streamGenUI, streamGenUIText } from '@nuxt-ui-genui/ai-sdk'
import { resolveGenUIMock, resolveGenUILive } from './genai'

/**
 * Playground-only provider resolver: maps the `GENAI_PROVIDER` environment
 * convention onto the three configurations the chat route can serve.
 *
 * Precedence (byte-for-byte when `GENAI_PROVIDER` is unset):
 * - No `GENAI_PROVIDER` → `resolveGenUIMock(env)` decides mock; otherwise
 *   `resolveGenUILive(env)` supplies the generic OpenAI-compatible endpoint.
 * - `mock` → the deterministic demo, keys ignored.
 * - `openai-compatible` → the generic endpoint with legacy `GENAI_MOCK` /
 *   `GENAI_LIVE` flags stripped, so an explicit provider beats them.
 * - `openui-cloud` → OpenUI Cloud Gateway, requires `THESYS_API_KEY` +
 *   `GENAI_MODEL`; the fixed base URL is the only host override allowed.
 */
export type GenUIProviderName = 'mock' | 'openai-compatible' | 'openui-cloud'

export const OPENUI_CLOUD_BASE_URL = 'https://api.thesys.dev/v1/embed'

/** Provider configuration errors: unknown provider, missing cloud credentials. */
export class GenUIProviderConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GenUIProviderConfigError'
  }
}

export interface GenUIProviderConfig {
  provider: GenUIProviderName
  mock: boolean
  cloud: boolean
  live?: GenUILiveOptions
}

export interface ChatPlan {
  stream: (options: StreamGenUIOptions) => Promise<Response>
  options: StreamGenUIOptions
}

/**
 * Resolve the playground's provider configuration from the environment.
 * `process.env` is read ONLY here (as the default argument).
 */
export function resolveGenUIProvider(env: Record<string, string | undefined> = process.env): GenUIProviderConfig {
  const provider = env.GENAI_PROVIDER
  if (provider === undefined) {
    // No explicit provider: exactly today's mock/live selection.
    if (resolveGenUIMock(env)) {
      return { provider: 'mock', mock: true, cloud: false }
    }
    return { provider: 'openai-compatible', mock: false, cloud: false, live: resolveGenUILive(env) }
  }
  if (provider === 'mock') {
    return { provider: 'mock', mock: true, cloud: false }
  }
  if (provider === 'openai-compatible') {
    const live = resolveGenUILive({ ...env, GENAI_MOCK: undefined, GENAI_LIVE: undefined })
    return { provider: 'openai-compatible', mock: false, cloud: false, live }
  }
  if (provider === 'openui-cloud') {
    const apiKey = env.THESYS_API_KEY
    if (!apiKey) {
      throw new GenUIProviderConfigError('GENAI_PROVIDER=openui-cloud requires THESYS_API_KEY on the server.')
    }
    const model = env.GENAI_MODEL
    if (!model) {
      throw new GenUIProviderConfigError('GENAI_PROVIDER=openui-cloud requires GENAI_MODEL (for example openai/gpt-5).')
    }
    return { provider: 'openui-cloud', mock: false, cloud: true, live: { apiKey, baseURL: OPENUI_CLOUD_BASE_URL, model } }
  }
  throw new GenUIProviderConfigError(
    `Unknown GENAI_PROVIDER "${provider}". Expected one of: mock, openai-compatible, openui-cloud.`
  )
}

/**
 * Plan a chat request against the provider config: pick the stream function
 * (`streamGenUI` for the AI SDK's UI-message-stream protocol, `streamGenUIText`
 * for plain OpenUI Lang text) and assemble the stream options.
 *
 * Mock configs carry `mockProgram`; live configs require a live endpoint and
 * throw the documented 503 configuration error when none exists.
 */
export function planChatRequest(input: {
  config: GenUIProviderConfig
  format: 'text' | 'ui-stream'
  messages: never[]
  systemPrompt: string
  mockProgram: string
}): ChatPlan {
  const { config, format, messages, systemPrompt, mockProgram } = input
  const stream = format === 'ui-stream' ? streamGenUI : streamGenUIText
  if (config.live) {
    return { stream, options: { systemPrompt, messages, live: config.live } }
  }
  if (config.mock) {
    return { stream, options: { systemPrompt, messages, mockProgram } }
  }
  throw new GenUIProviderConfigError(
    'Live model not configured. Set GENAI_API_KEY (plus optional GENAI_BASE_URL / GENAI_MODEL) in apps/playground/.env, or run with GENAI_MOCK=1 for the deterministic demo.'
  )
}
